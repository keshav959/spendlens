package com.expensetracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "receipt_path")
    private String receiptPath;

    @Column(name = "receipt_original_name")
    private String receiptOriginalName;

    @Column(name = "receipt_uploaded_at")
    private LocalDateTime receiptUploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Expense() {}

    public Expense(Long id, String title, String description, BigDecimal amount, Category category,
                   LocalDate expenseDate, LocalDateTime createdAt, LocalDateTime updatedAt,
                   String receiptPath, String receiptOriginalName, LocalDateTime receiptUploadedAt, User user) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.expenseDate = expenseDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.receiptPath = receiptPath;
        this.receiptOriginalName = receiptOriginalName;
        this.receiptUploadedAt = receiptUploadedAt;
        this.user = user;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getReceiptPath() {
        return receiptPath;
    }

    public void setReceiptPath(String receiptPath) {
        this.receiptPath = receiptPath;
    }

    public String getReceiptOriginalName() {
        return receiptOriginalName;
    }

    public void setReceiptOriginalName(String receiptOriginalName) {
        this.receiptOriginalName = receiptOriginalName;
    }

    public LocalDateTime getReceiptUploadedAt() {
        return receiptUploadedAt;
    }

    public void setReceiptUploadedAt(LocalDateTime receiptUploadedAt) {
        this.receiptUploadedAt = receiptUploadedAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Category {
        FOOD, TRANSPORT, HOUSING, ENTERTAINMENT, HEALTHCARE,
        SHOPPING, EDUCATION, UTILITIES, TRAVEL, OTHER
    }

    public static class Builder {
        private Long id;
        private String title;
        private String description;
        private BigDecimal amount;
        private Category category;
        private LocalDate expenseDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String receiptPath;
        private String receiptOriginalName;
        private LocalDateTime receiptUploadedAt;
        private User user;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder category(Category category) {
            this.category = category;
            return this;
        }

        public Builder expenseDate(LocalDate expenseDate) {
            this.expenseDate = expenseDate;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder receiptPath(String receiptPath) {
            this.receiptPath = receiptPath;
            return this;
        }

        public Builder receiptOriginalName(String receiptOriginalName) {
            this.receiptOriginalName = receiptOriginalName;
            return this;
        }

        public Builder receiptUploadedAt(LocalDateTime receiptUploadedAt) {
            this.receiptUploadedAt = receiptUploadedAt;
            return this;
        }

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Expense build() {
            return new Expense(id, title, description, amount, category, expenseDate, createdAt, updatedAt,
                    receiptPath, receiptOriginalName, receiptUploadedAt, user);
        }
    }
}
