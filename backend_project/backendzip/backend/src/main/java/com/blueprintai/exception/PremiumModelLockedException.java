package com.blueprintai.exception;

public class PremiumModelLockedException extends RuntimeException {
    public PremiumModelLockedException(String message) {
        super(message);
    }
}
