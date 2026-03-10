package com.expensetracker.controller;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createOrUpdate(@Valid @RequestBody BudgetRequest request) {
        BudgetResponse response = budgetService.createOrUpdate(request);
        return ResponseEntity.ok(ApiResponse.success("Budget saved", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getByMonth(@RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgets(month)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted", null));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<BudgetAlert>>> getAlerts(@RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getAlerts(month)));
    }
}
