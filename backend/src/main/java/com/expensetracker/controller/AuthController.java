package com.expensetracker.controller;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginStepResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginStepResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to email", response));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<LoginStepResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        LoginStepResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to phone", response));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<AuthResponse>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful", response));
    }

    @PostMapping("/set-phone")
    public ResponseEntity<ApiResponse<LoginStepResponse>> setPhone(@Valid @RequestBody SetPhoneRequest request) {
        LoginStepResponse response = authService.setPhone(request);
        return ResponseEntity.ok(ApiResponse.success("Phone saved, OTP sent", response));
    }
}
