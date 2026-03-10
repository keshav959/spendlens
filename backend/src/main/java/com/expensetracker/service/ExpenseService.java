package com.expensetracker.service;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Expense.Category;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private AuthService authService;

    @Value("${app.receipts.base-dir:uploads/receipts}")
    private String receiptsBaseDir;

    @Value("${app.receipts.max-bytes:5242880}")
    private long receiptsMaxBytes;

    public ExpenseResponse create(ExpenseRequest request) {
        User user = authService.getCurrentUser();
        Expense expense = Expense.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .expenseDate(request.getExpenseDate())
                .user(user)
                .build();
        return toResponse(expenseRepository.save(expense));
    }

    public Page<ExpenseResponse> getAll(int page, int size, String sortBy, String direction) {
        User user = authService.getCurrentUser();
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return expenseRepository.findByUserIdOrderByExpenseDateDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    public List<ExpenseResponse> getAll() {
        User user = authService.getCurrentUser();
        return expenseRepository.findByUserIdOrderByExpenseDateDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ExpenseResponse getById(Long id) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        return toResponse(expense);
    }

    public ExpenseResponse update(Long id, ExpenseRequest request) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        expense.setTitle(request.getTitle());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setExpenseDate(request.getExpenseDate());
        return toResponse(expenseRepository.save(expense));
    }

    public void delete(Long id) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        deleteReceiptFile(expense.getReceiptPath());
        expenseRepository.delete(expense);
    }

    public List<ExpenseResponse> getByCategory(Category category) {
        User user = authService.getCurrentUser();
        return expenseRepository.findByUserIdAndCategoryOrderByExpenseDateDesc(user.getId(), category)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ExpenseResponse> getByDateRange(LocalDate start, LocalDate end) {
        User user = authService.getCurrentUser();
        return expenseRepository.findByUserIdAndExpenseDateBetweenOrderByExpenseDateDesc(user.getId(), start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DashboardStats getDashboardStats() {
        User user = authService.getCurrentUser();
        Long userId = user.getId();

        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate weekStart = now.minusDays(now.getDayOfWeek().getValue() - 1);

        BigDecimal total = Optional.ofNullable(expenseRepository.sumAmountByUserId(userId))
                .orElse(BigDecimal.ZERO);
        BigDecimal monthly = Optional.ofNullable(expenseRepository.sumAmountByUserIdAndDateRange(userId, monthStart, now))
                .orElse(BigDecimal.ZERO);
        BigDecimal weekly = Optional.ofNullable(expenseRepository.sumAmountByUserIdAndDateRange(userId, weekStart, now))
                .orElse(BigDecimal.ZERO);

        List<Object[]> categorySums = expenseRepository.sumAmountByCategory(userId);
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Object[] row : categorySums) {
            byCategory.put(row[0].toString(), (BigDecimal) row[1]);
        }

        List<Object[]> monthlyData = expenseRepository.monthlyExpensesByYear(userId, now.getYear());
        Map<String, BigDecimal> monthlyTrend = new LinkedHashMap<>();
        String[] monthNames = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        for (Object[] row : monthlyData) {
            int m = ((Number) row[0]).intValue();
            monthlyTrend.put(monthNames[m - 1], (BigDecimal) row[1]);
        }

        long txCount = expenseRepository.findByUserIdOrderByExpenseDateDesc(userId).size();

        return DashboardStats.builder()
                .totalExpenses(total)
                .monthlyExpenses(monthly)
                .weeklyExpenses(weekly)
                .totalTransactions(txCount)
                .expensesByCategory(byCategory)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    public ExpenseResponse uploadReceipt(Long id, MultipartFile file) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Receipt file is required");
        }
        if (file.getSize() > receiptsMaxBytes) {
            throw new RuntimeException("Receipt file is too large");
        }
        String contentType = Optional.ofNullable(file.getContentType()).orElse("");
        if (!(contentType.equals("application/pdf") || contentType.startsWith("image/"))) {
            throw new RuntimeException("Only image or PDF files are allowed");
        }

        String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("receipt");
        originalName = Paths.get(originalName).getFileName().toString();
        String extension = getExtension(originalName);
        if (extension.isEmpty()) {
            extension = contentType.equals("application/pdf") ? ".pdf" : ".jpg";
        }

        try {
            Path dir = Paths.get(receiptsBaseDir, String.valueOf(user.getId()), String.valueOf(expense.getId()));
            Files.createDirectories(dir);
            Path target = dir.resolve("receipt" + extension.toLowerCase(Locale.ROOT));

            if (expense.getReceiptPath() != null && !expense.getReceiptPath().equals(target.toString())) {
                deleteReceiptFile(expense.getReceiptPath());
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            expense.setReceiptPath(target.toString());
            expense.setReceiptOriginalName(originalName);
            expense.setReceiptUploadedAt(LocalDateTime.now());
            return toResponse(expenseRepository.save(expense));
        } catch (Exception e) {
            throw new RuntimeException("Failed to store receipt");
        }
    }

    public ReceiptDownload getReceipt(Long id) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        if (expense.getReceiptPath() == null || expense.getReceiptPath().isBlank()) {
            throw new RuntimeException("Receipt not found");
        }
        try {
            Path path = Paths.get(expense.getReceiptPath());
            if (!Files.exists(path)) {
                throw new RuntimeException("Receipt not found");
            }
            Resource resource = new UrlResource(path.toUri());
            String contentType = Optional.ofNullable(Files.probeContentType(path)).orElse("application/octet-stream");
            String filename = Optional.ofNullable(expense.getReceiptOriginalName()).orElse(path.getFileName().toString());
            filename = filename.replace("\"", "'");
            return new ReceiptDownload(resource, contentType, filename);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load receipt");
        }
    }

    public ExpenseResponse deleteReceipt(Long id) {
        User user = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        deleteReceiptFile(expense.getReceiptPath());
        expense.setReceiptPath(null);
        expense.setReceiptOriginalName(null);
        expense.setReceiptUploadedAt(null);
        return toResponse(expenseRepository.save(expense));
    }

    private void deleteReceiptFile(String path) {
        if (path == null || path.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (Exception ignored) {}
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx == -1) return "";
        return filename.substring(idx);
    }

    private ExpenseResponse toResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .amount(e.getAmount())
                .category(e.getCategory())
                .expenseDate(e.getExpenseDate())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .receiptAvailable(e.getReceiptPath() != null && !e.getReceiptPath().isBlank())
                .receiptOriginalName(e.getReceiptOriginalName())
                .receiptUploadedAt(e.getReceiptUploadedAt())
                .build();
    }

    public static class ReceiptDownload {
        private final Resource resource;
        private final String contentType;
        private final String filename;

        public ReceiptDownload(Resource resource, String contentType, String filename) {
            this.resource = resource;
            this.contentType = contentType;
            this.filename = filename;
        }

        public Resource getResource() {
            return resource;
        }

        public String getContentType() {
            return contentType;
        }

        public String getFilename() {
            return filename;
        }
    }
}
