package com.expensetracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.MessageAttributeValue;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsService {

    private final SnsClient snsClient;
    private final String senderId;
    private final String smsType;

    public SmsService(
            @Value("${app.sns.region}") String region,
            @Value("${app.sns.sender-id:}") String senderId,
            @Value("${app.sns.sms-type:Transactional}") String smsType
    ) {
        this.snsClient = SnsClient.builder()
                .region(Region.of(region))
                .build();
        this.senderId = senderId;
        this.smsType = smsType;
    }

    public void sendOtpSms(String phoneE164, String otp) {
        String message = "Your SpendLens OTP is " + otp + ". It expires in 5 minutes.";
        Map<String, MessageAttributeValue> attrs = new HashMap<>();
        attrs.put("AWS.SNS.SMS.SMSType", MessageAttributeValue.builder()
                .dataType("String")
                .stringValue(smsType)
                .build());
        if (senderId != null && !senderId.isBlank()) {
            attrs.put("AWS.SNS.SMS.SenderID", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(senderId)
                    .build());
        }

        PublishRequest request = PublishRequest.builder()
                .message(message)
                .phoneNumber(phoneE164)
                .messageAttributes(attrs)
                .build();
        snsClient.publish(request);
    }
}
