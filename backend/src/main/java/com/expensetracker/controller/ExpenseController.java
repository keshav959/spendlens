package com.expensetracker.controller;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.entity.Expense.Category;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> create(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Expense created", expenseService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getAll()));
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<Page<ExpenseResponse>>> getPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getAll(page, size, sortBy, direction)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Expense updated", expenseService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }

    @PostMapping("/{id}/receipt")
    public ResponseEntity<ApiResponse<ExpenseResponse>> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        ExpenseResponse response = expenseService.uploadReceipt(id, file);
        return ResponseEntity.ok(ApiResponse.success("Receipt uploaded", response));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<org.springframework.core.io.Resource> downloadReceipt(@PathVariable Long id) {
        ExpenseService.ReceiptDownload download = expenseService.getReceipt(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.getFilename() + "\"")
                .body(download.getResource());
    }

    @DeleteMapping("/{id}/receipt")
    public ResponseEntity<ApiResponse<ExpenseResponse>> deleteReceipt(@PathVariable Long id) {
        ExpenseResponse response = expenseService.deleteReceipt(id);
        return ResponseEntity.ok(ApiResponse.success("Receipt deleted", response));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getByCategory(@PathVariable Category category) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getByCategory(category)));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getByDateRange(start, end)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getDashboardStats()));
    }
}
