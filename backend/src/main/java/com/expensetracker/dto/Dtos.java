package com.expensetracker.dto;

import com.expensetracker.entity.Expense.Category;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public class Dtos {

    // ===== AUTH DTOs =====
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        public RegisterRequest() {}

        public RegisterRequest(String name, String email, String phone, String password) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.password = password;
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
    }

    public static class LoginRequest {
        @Email(message = "Invalid email format")
        private String email;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        @NotBlank(message = "Password is required")
        private String password;

        public LoginRequest() {}

        public LoginRequest(String email, String phone, String password) {
            this.email = email;
            this.phone = phone;
            this.password = password;
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
    }

    public static class LoginStepResponse {
        private boolean otpRequired;
        private boolean phoneRequired;

        public LoginStepResponse() {}

        public LoginStepResponse(boolean otpRequired) {
            this.otpRequired = otpRequired;
        }

        public LoginStepResponse(boolean otpRequired, boolean phoneRequired) {
            this.otpRequired = otpRequired;
            this.phoneRequired = phoneRequired;
        }

        public boolean isOtpRequired() {
            return otpRequired;
        }

        public void setOtpRequired(boolean otpRequired) {
            this.otpRequired = otpRequired;
        }

        public boolean isPhoneRequired() {
            return phoneRequired;
        }

        public void setPhoneRequired(boolean phoneRequired) {
            this.phoneRequired = phoneRequired;
        }
    }

    public static class VerifyOtpRequest {
        private String email;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        @NotBlank(message = "OTP is required")
        private String otp;

        public VerifyOtpRequest() {}

        public VerifyOtpRequest(String email, String phone, String otp) {
            this.email = email;
            this.phone = phone;
            this.otp = otp;
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

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }

    public static class ForgotPasswordRequest {
        private String email;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        public ForgotPasswordRequest() {}

        public ForgotPasswordRequest(String email, String phone) {
            this.email = email;
            this.phone = phone;
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
    }

    public static class ResetPasswordRequest {
        private String email;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        @NotBlank(message = "OTP is required")
        private String otp;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;

        public ResetPasswordRequest() {}

        public ResetPasswordRequest(String email, String phone, String otp, String newPassword) {
            this.email = email;
            this.phone = phone;
            this.otp = otp;
            this.newPassword = newPassword;
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

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class SetPhoneRequest {
        @Email(message = "Invalid email format")
        private String email;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String phone;

        @NotBlank(message = "Password is required")
        private String password;

        public SetPhoneRequest() {}

        public SetPhoneRequest(String email, String phone, String password) {
            this.email = email;
            this.phone = phone;
            this.password = password;
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
    }

    public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String name;
        private String email;

        public AuthResponse() {}

        public AuthResponse(String token, String type, Long id, String name, String email) {
            this.token = token;
            this.type = type != null ? type : "Bearer";
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
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

        public static class Builder {
            private String token;
            private String type;
            private Long id;
            private String name;
            private String email;

            public Builder token(String token) {
                this.token = token;
                return this;
            }

            public Builder type(String type) {
                this.type = type;
                return this;
            }

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

            public AuthResponse build() {
                AuthResponse response = new AuthResponse();
                response.token = token;
                response.type = type != null ? type : "Bearer";
                response.id = id;
                response.name = name;
                response.email = email;
                return response;
            }
        }
    }

    // ===== EXPENSE DTOs =====
    public static class ExpenseRequest {
        @NotBlank(message = "Title is required")
        private String title;

        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Category is required")
        private Category category;

        @NotNull(message = "Date is required")
        private LocalDate expenseDate;

        public ExpenseRequest() {}

        public ExpenseRequest(String title, String description, BigDecimal amount, Category category, LocalDate expenseDate) {
            this.title = title;
            this.description = description;
            this.amount = amount;
            this.category = category;
            this.expenseDate = expenseDate;
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
    }

    public static class ExpenseResponse {
        private Long id;
        private String title;
        private String description;
        private BigDecimal amount;
        private Category category;
        private LocalDate expenseDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ExpenseResponse() {}

        public ExpenseResponse(Long id, String title, String description, BigDecimal amount, Category category,
                               LocalDate expenseDate, LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.amount = amount;
            this.category = category;
            this.expenseDate = expenseDate;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
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

        public static class Builder {
            private Long id;
            private String title;
            private String description;
            private BigDecimal amount;
            private Category category;
            private LocalDate expenseDate;
            private LocalDateTime createdAt;
            private LocalDateTime updatedAt;

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

            public ExpenseResponse build() {
                return new ExpenseResponse(id, title, description, amount, category, expenseDate, createdAt, updatedAt);
            }
        }
    }

    public static class RecurringRequest {
        @NotBlank(message = "Title is required")
        private String title;

        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Category is required")
        private Category category;

        @NotNull(message = "Frequency is required")
        private String frequency; // WEEKLY or MONTHLY

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        public RecurringRequest() {}

        public RecurringRequest(String title, String description, BigDecimal amount, Category category,
                                String frequency, LocalDate startDate) {
            this.title = title;
            this.description = description;
            this.amount = amount;
            this.category = category;
            this.frequency = frequency;
            this.startDate = startDate;
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

        public String getFrequency() {
            return frequency;
        }

        public void setFrequency(String frequency) {
            this.frequency = frequency;
        }

        public LocalDate getStartDate() {
            return startDate;
        }

        public void setStartDate(LocalDate startDate) {
            this.startDate = startDate;
        }
    }

    public static class RecurringResponse {
        private Long id;
        private String title;
        private String description;
        private BigDecimal amount;
        private Category category;
        private String frequency;
        private LocalDate nextRunDate;
        private boolean active;

        public RecurringResponse() {}

        public RecurringResponse(Long id, String title, String description, BigDecimal amount, Category category,
                                 String frequency, LocalDate nextRunDate, boolean active) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.amount = amount;
            this.category = category;
            this.frequency = frequency;
            this.nextRunDate = nextRunDate;
            this.active = active;
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

        public String getFrequency() {
            return frequency;
        }

        public void setFrequency(String frequency) {
            this.frequency = frequency;
        }

        public LocalDate getNextRunDate() {
            return nextRunDate;
        }

        public void setNextRunDate(LocalDate nextRunDate) {
            this.nextRunDate = nextRunDate;
        }

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }
    }

    public static class DashboardStats {
        private BigDecimal totalExpenses;
        private BigDecimal monthlyExpenses;
        private BigDecimal weeklyExpenses;
        private long totalTransactions;
        private Map<String, BigDecimal> expensesByCategory;
        private Map<String, BigDecimal> monthlyTrend;

        public DashboardStats() {}

        public DashboardStats(BigDecimal totalExpenses, BigDecimal monthlyExpenses, BigDecimal weeklyExpenses,
                              long totalTransactions, Map<String, BigDecimal> expensesByCategory,
                              Map<String, BigDecimal> monthlyTrend) {
            this.totalExpenses = totalExpenses;
            this.monthlyExpenses = monthlyExpenses;
            this.weeklyExpenses = weeklyExpenses;
            this.totalTransactions = totalTransactions;
            this.expensesByCategory = expensesByCategory;
            this.monthlyTrend = monthlyTrend;
        }

        public static Builder builder() {
            return new Builder();
        }

        public BigDecimal getTotalExpenses() {
            return totalExpenses;
        }

        public void setTotalExpenses(BigDecimal totalExpenses) {
            this.totalExpenses = totalExpenses;
        }

        public BigDecimal getMonthlyExpenses() {
            return monthlyExpenses;
        }

        public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
            this.monthlyExpenses = monthlyExpenses;
        }

        public BigDecimal getWeeklyExpenses() {
            return weeklyExpenses;
        }

        public void setWeeklyExpenses(BigDecimal weeklyExpenses) {
            this.weeklyExpenses = weeklyExpenses;
        }

        public long getTotalTransactions() {
            return totalTransactions;
        }

        public void setTotalTransactions(long totalTransactions) {
            this.totalTransactions = totalTransactions;
        }

        public Map<String, BigDecimal> getExpensesByCategory() {
            return expensesByCategory;
        }

        public void setExpensesByCategory(Map<String, BigDecimal> expensesByCategory) {
            this.expensesByCategory = expensesByCategory;
        }

        public Map<String, BigDecimal> getMonthlyTrend() {
            return monthlyTrend;
        }

        public void setMonthlyTrend(Map<String, BigDecimal> monthlyTrend) {
            this.monthlyTrend = monthlyTrend;
        }

        public static class Builder {
            private BigDecimal totalExpenses;
            private BigDecimal monthlyExpenses;
            private BigDecimal weeklyExpenses;
            private long totalTransactions;
            private Map<String, BigDecimal> expensesByCategory;
            private Map<String, BigDecimal> monthlyTrend;

            public Builder totalExpenses(BigDecimal totalExpenses) {
                this.totalExpenses = totalExpenses;
                return this;
            }

            public Builder monthlyExpenses(BigDecimal monthlyExpenses) {
                this.monthlyExpenses = monthlyExpenses;
                return this;
            }

            public Builder weeklyExpenses(BigDecimal weeklyExpenses) {
                this.weeklyExpenses = weeklyExpenses;
                return this;
            }

            public Builder totalTransactions(long totalTransactions) {
                this.totalTransactions = totalTransactions;
                return this;
            }

            public Builder expensesByCategory(Map<String, BigDecimal> expensesByCategory) {
                this.expensesByCategory = expensesByCategory;
                return this;
            }

            public Builder monthlyTrend(Map<String, BigDecimal> monthlyTrend) {
                this.monthlyTrend = monthlyTrend;
                return this;
            }

            public DashboardStats build() {
                return new DashboardStats(totalExpenses, monthlyExpenses, weeklyExpenses, totalTransactions,
                        expensesByCategory, monthlyTrend);
            }
        }
    }

    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public ApiResponse() {}

        public ApiResponse(boolean success, String message, T data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public static <T> Builder<T> builder() {
            return new Builder<>();
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public T getData() {
            return data;
        }

        public void setData(T data) {
            this.data = data;
        }

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message("Success")
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> success(String message, T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message(message)
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .build();
        }

        public static class Builder<T> {
            private boolean success;
            private String message;
            private T data;

            public Builder<T> success(boolean success) {
                this.success = success;
                return this;
            }

            public Builder<T> message(String message) {
                this.message = message;
                return this;
            }

            public Builder<T> data(T data) {
                this.data = data;
                return this;
            }

            public ApiResponse<T> build() {
                return new ApiResponse<>(success, message, data);
            }
        }
    }
}
