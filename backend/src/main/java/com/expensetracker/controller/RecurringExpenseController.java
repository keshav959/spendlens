package com.expensetracker.controller;

import com.expensetracker.dto.Dtos.ApiResponse;
import com.expensetracker.dto.Dtos.RecurringRequest;
import com.expensetracker.dto.Dtos.RecurringResponse;
import com.expensetracker.service.RecurringExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RecurringExpenseController {

    @Autowired
    private RecurringExpenseService recurringService;

    @PostMapping
    public ResponseEntity<ApiResponse<RecurringResponse>> create(@Valid @RequestBody RecurringRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Recurring expense created", recurringService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RecurringResponse>> update(@PathVariable Long id, @Valid @RequestBody RecurringRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Recurring expense updated", recurringService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        recurringService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Recurring expense deleted", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecurringResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(recurringService.getAll()));
    }
}
