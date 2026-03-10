package com.expensetracker.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "otp_code_hash")
    private String otpCodeHash;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Expense> expenses;

    public User() {}

    public User(Long id, String name, String email, String phone, String password, LocalDateTime createdAt,
                String otpCodeHash, LocalDateTime otpExpiry, List<Expense> expenses) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.createdAt = createdAt;
        this.otpCodeHash = otpCodeHash;
        this.otpExpiry = otpExpiry;
        this.expenses = expenses;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getOtpCodeHash() {
        return otpCodeHash;
    }

    public void setOtpCodeHash(String otpCodeHash) {
        this.otpCodeHash = otpCodeHash;
    }

    public LocalDateTime getOtpExpiry() {
        return otpExpiry;
    }

    public void setOtpExpiry(LocalDateTime otpExpiry) {
        this.otpExpiry = otpExpiry;
    }

    public List<Expense> getExpenses() {
        return expenses;
    }

    public void setExpenses(List<Expense> expenses) {
        this.expenses = expenses;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String password;
        private LocalDateTime createdAt;
        private String otpCodeHash;
        private LocalDateTime otpExpiry;
        private List<Expense> expenses;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder otpCodeHash(String otpCodeHash) {
            this.otpCodeHash = otpCodeHash;
            return this;
        }

        public Builder otpExpiry(LocalDateTime otpExpiry) {
            this.otpExpiry = otpExpiry;
            return this;
        }

        public Builder expenses(List<Expense> expenses) {
            this.expenses = expenses;
            return this;
        }

        public User build() {
            return new User(id, name, email, phone, password, createdAt, otpCodeHash, otpExpiry, expenses);
        }
    }
}
