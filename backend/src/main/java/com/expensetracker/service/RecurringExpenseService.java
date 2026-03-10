package com.expensetracker.service;

import com.expensetracker.dto.Dtos.RecurringRequest;
import com.expensetracker.dto.Dtos.RecurringResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.RecurringExpense;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.RecurringExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecurringExpenseService {

    @Autowired private RecurringExpenseRepository recurringRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private AuthService authService;

    public RecurringResponse create(RecurringRequest request) {
        User user = authService.getCurrentUser();
        RecurringExpense recurring = new RecurringExpense();
        recurring.setTitle(request.getTitle());
        recurring.setDescription(request.getDescription());
        recurring.setAmount(request.getAmount());
        recurring.setCategory(request.getCategory());
        recurring.setFrequency(parseFrequency(request.getFrequency()));
        recurring.setUser(user);

        LocalDate startDate = request.getStartDate();
        if (recurring.getFrequency() == RecurringExpense.Frequency.MONTHLY) {
            recurring.setDayOfMonth(startDate.getDayOfMonth());
        } else {
            recurring.setDayOfWeek(startDate.getDayOfWeek().getValue());
        }
        recurring.setNextRunDate(computeInitialNextRunDate(startDate, recurring));

        return toResponse(recurringRepository.save(recurring));
    }

    public RecurringResponse update(Long id, RecurringRequest request) {
        User user = authService.getCurrentUser();
        RecurringExpense recurring = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));
        if (!recurring.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Recurring expense not found");
        }
        recurring.setTitle(request.getTitle());
        recurring.setDescription(request.getDescription());
        recurring.setAmount(request.getAmount());
        recurring.setCategory(request.getCategory());
        recurring.setFrequency(parseFrequency(request.getFrequency()));

        LocalDate startDate = request.getStartDate();
        if (recurring.getFrequency() == RecurringExpense.Frequency.MONTHLY) {
            recurring.setDayOfMonth(startDate.getDayOfMonth());
            recurring.setDayOfWeek(null);
        } else {
            recurring.setDayOfWeek(startDate.getDayOfWeek().getValue());
            recurring.setDayOfMonth(null);
        }
        recurring.setNextRunDate(computeInitialNextRunDate(startDate, recurring));

        return toResponse(recurringRepository.save(recurring));
    }

    public void delete(Long id) {
        User user = authService.getCurrentUser();
        RecurringExpense recurring = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));
        if (!recurring.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Recurring expense not found");
        }
        recurringRepository.delete(recurring);
    }

    public List<RecurringResponse> getAll() {
        User user = authService.getCurrentUser();
        return recurringRepository.findByUserIdOrderByNextRunDateAsc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void runDueRecurring() {
        LocalDate today = LocalDate.now();
        List<RecurringExpense> due = recurringRepository.findByActiveTrueAndNextRunDateLessThanEqual(today);
        for (RecurringExpense r : due) {
            Expense expense = new Expense();
            expense.setTitle(r.getTitle());
            expense.setDescription(r.getDescription());
            expense.setAmount(r.getAmount());
            expense.setCategory(r.getCategory());
            expense.setExpenseDate(r.getNextRunDate());
            expense.setUser(r.getUser());
            expenseRepository.save(expense);

            r.setNextRunDate(computeNextRunDate(r.getNextRunDate(), r));
            recurringRepository.save(r);
        }
    }

    private RecurringExpense.Frequency parseFrequency(String frequency) {
        try {
            return RecurringExpense.Frequency.valueOf(frequency.toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid frequency");
        }
    }

    private LocalDate computeInitialNextRunDate(LocalDate start, RecurringExpense recurring) {
        LocalDate today = LocalDate.now();
        if (!start.isBefore(today)) {
            return start;
        }
        if (recurring.getFrequency() == RecurringExpense.Frequency.WEEKLY) {
            int dow = recurring.getDayOfWeek() != null ? recurring.getDayOfWeek() : today.getDayOfWeek().getValue();
            DayOfWeek dayOfWeek = DayOfWeek.of(dow);
            return today.with(TemporalAdjusters.nextOrSame(dayOfWeek));
        }
        return computeNextRunDate(today.minusDays(1), recurring);
    }

    private LocalDate computeNextRunDate(LocalDate from, RecurringExpense recurring) {
        if (recurring.getFrequency() == RecurringExpense.Frequency.WEEKLY) {
            return from.plusWeeks(1);
        }
        int dayOfMonth = recurring.getDayOfMonth() != null ? recurring.getDayOfMonth() : from.getDayOfMonth();
        LocalDate nextMonth = from.plusMonths(1);
        int dom = Math.min(dayOfMonth, nextMonth.lengthOfMonth());
        return nextMonth.withDayOfMonth(dom);
    }

    private RecurringResponse toResponse(RecurringExpense r) {
        return new RecurringResponse(
                r.getId(),
                r.getTitle(),
                r.getDescription(),
                r.getAmount(),
                r.getCategory(),
                r.getFrequency().name(),
                r.getNextRunDate(),
                r.isActive()
        );
    }
}
