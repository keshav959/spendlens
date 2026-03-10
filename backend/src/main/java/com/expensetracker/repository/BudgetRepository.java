package com.expensetracker.repository;

import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Expense.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserIdAndMonthOrderByCategoryAsc(Long userId, String month);
    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId AND b.month = :month " +
           "AND ((:category IS NULL AND b.category IS NULL) OR b.category = :category)")
    Optional<Budget> findByUserIdAndMonthAndCategory(
            @Param("userId") Long userId,
            @Param("month") String month,
            @Param("category") Category category);
}
