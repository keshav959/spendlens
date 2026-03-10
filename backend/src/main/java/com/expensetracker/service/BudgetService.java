package com.expensetracker.service;

import com.expensetracker.dto.Dtos.BudgetAlert;
import com.expensetracker.dto.Dtos.BudgetRequest;
import com.expensetracker.dto.Dtos.BudgetResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Expense.Category;
import com.expensetracker.entity.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    @Autowired private BudgetRepository budgetRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private AuthService authService;

    public BudgetResponse createOrUpdate(BudgetRequest request) {
        User user = authService.getCurrentUser();
        String month = normalizeMonth(request.getMonth());
        Category category = request.getCategory();

        Budget budget = budgetRepository.findByUserIdAndMonthAndCategory(user.getId(), month, category)
                .orElseGet(Budget::new);
        budget.setUser(user);
        budget.setMonth(month);
        budget.setCategory(category);
        budget.setAmount(request.getAmount());
        budget.setThresholdPercent(Optional.ofNullable(request.getThresholdPercent()).orElse(80));

        Budget saved = budgetRepository.save(budget);
        return toResponse(saved);
    }

    public List<BudgetResponse> getBudgets(String month) {
        User user = authService.getCurrentUser();
        String normalized = normalizeMonth(month);
        return budgetRepository.findByUserIdAndMonthOrderByCategoryAsc(user.getId(), normalized)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteBudget(Long id) {
        User user = authService.getCurrentUser();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        budgetRepository.delete(budget);
    }

    public List<BudgetAlert> getAlerts(String month) {
        User user = authService.getCurrentUser();
        String normalized = normalizeMonth(month);
        YearMonth yearMonth = YearMonth.parse(normalized);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        BigDecimal totalSpent = Optional.ofNullable(
                expenseRepository.sumAmountByUserIdAndDateRange(user.getId(), start, end))
                .orElse(BigDecimal.ZERO);

        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);
        List<Object[]> rows = expenseRepository.sumAmountByCategoryAndDateRange(user.getId(), start, end);
        for (Object[] row : rows) {
            byCategory.put((Category) row[0], (BigDecimal) row[1]);
        }

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthOrderByCategoryAsc(user.getId(), normalized);
        List<BudgetAlert> alerts = new ArrayList<>();
        for (Budget budget : budgets) {
            BigDecimal spent = budget.getCategory() == null ? totalSpent :
                    byCategory.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            BigDecimal amount = budget.getAmount() == null ? BigDecimal.ZERO : budget.getAmount();
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            int threshold = Optional.ofNullable(budget.getThresholdPercent()).orElse(80);
            BigDecimal thresholdAmount = amount.multiply(BigDecimal.valueOf(threshold))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (spent.compareTo(thresholdAmount) >= 0) {
                BigDecimal percentUsed = spent.multiply(BigDecimal.valueOf(100))
                        .divide(amount, 2, RoundingMode.HALF_UP);
                alerts.add(new BudgetAlert(
                        budget.getId(),
                        budget.getMonth(),
                        budget.getCategory(),
                        amount,
                        spent,
                        threshold,
                        percentUsed
                ));
            }
        }
        return alerts;
    }

    private String normalizeMonth(String month) {
        try {
            return YearMonth.parse(month).toString();
        } catch (Exception e) {
            throw new RuntimeException("Invalid month format. Use YYYY-MM.");
        }
    }

    private BudgetResponse toResponse(Budget budget) {
        return BudgetResponse.from(
                budget.getId(),
                budget.getMonth(),
                budget.getCategory(),
                budget.getAmount(),
                budget.getThresholdPercent(),
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }
}
