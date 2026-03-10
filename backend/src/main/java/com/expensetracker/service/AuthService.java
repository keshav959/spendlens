package com.expensetracker.service;

import com.expensetracker.dto.Dtos.*;
import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private SmsService smsService;

    @Value("${app.otp.expiration-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.phone.default-country-code:+91}")
    private String defaultCountryCode;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        String normalizedPhone = normalizePhone(request.getPhone());
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new RuntimeException("Phone already registered");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(normalizedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        String token = jwtUtils.generateTokenFromEmail(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public LoginStepResponse login(LoginRequest request) {
        String identifier = firstNonBlank(normalizePhone(request.getPhone()), request.getEmail());
        if (identifier == null) {
            throw new RuntimeException("Email or phone is required");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            return new LoginStepResponse(false, true);
        }
        String otp = generateOtp();
        user.setOtpCodeHash(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userRepository.save(user);
        smsService.sendOtpSms(user.getPhone(), otp);
        return new LoginStepResponse(true, false);
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String identifier = firstNonBlank(normalizePhone(request.getPhone()), request.getEmail());
        if (identifier == null) {
            throw new RuntimeException("Email or phone is required");
        }
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getOtpExpiry() == null || user.getOtpCodeHash() == null) {
            throw new RuntimeException("OTP not requested");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }
        if (!passwordEncoder.matches(request.getOtp(), user.getOtpCodeHash())) {
            throw new RuntimeException("Invalid OTP");
        }
        user.setOtpCodeHash(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtUtils.generateTokenFromEmail(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public LoginStepResponse forgotPassword(ForgotPasswordRequest request) {
        String identifier = firstNonBlank(normalizePhone(request.getPhone()), request.getEmail());
        if (identifier == null) {
            throw new RuntimeException("Email or phone is required");
        }
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new RuntimeException("Phone number not set for this account");
        }
        String otp = generateOtp();
        user.setOtpCodeHash(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userRepository.save(user);
        smsService.sendOtpSms(user.getPhone(), otp);
        return new LoginStepResponse(true, false);
    }

    public LoginStepResponse setPhone(SetPhoneRequest request) {
        String identifier = firstNonBlank(normalizePhone(request.getPhone()), request.getEmail());
        if (identifier == null) {
            throw new RuntimeException("Email or phone is required");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
        String normalizedPhone = normalizePhone(request.getPhone());
        if (normalizedPhone == null) {
            throw new RuntimeException("Phone is required");
        }
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new RuntimeException("Phone already registered");
        }
        user.setPhone(normalizedPhone);

        String otp = generateOtp();
        user.setOtpCodeHash(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userRepository.save(user);
        smsService.sendOtpSms(user.getPhone(), otp);
        return new LoginStepResponse(true, false);
    }

    public AuthResponse resetPassword(ResetPasswordRequest request) {
        String identifier = firstNonBlank(normalizePhone(request.getPhone()), request.getEmail());
        if (identifier == null) {
            throw new RuntimeException("Email or phone is required");
        }
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getOtpExpiry() == null || user.getOtpCodeHash() == null) {
            throw new RuntimeException("OTP not requested");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }
        if (!passwordEncoder.matches(request.getOtp(), user.getOtpCodeHash())) {
            throw new RuntimeException("Invalid OTP");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtpCodeHash(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtUtils.generateTokenFromEmail(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String generateOtp() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String trimmed = phone.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.startsWith("+")) return trimmed;
        if (trimmed.matches("\\\\d{10,15}")) {
            if (trimmed.length() == 10) {
                return defaultCountryCode + trimmed;
            }
            return "+" + trimmed;
        }
        return trimmed;
    }
}
