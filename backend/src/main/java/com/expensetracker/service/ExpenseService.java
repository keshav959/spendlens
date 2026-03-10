package com.expensetracker.service;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Expense.Category;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private AuthService authService;

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
                .build();
    }
}
