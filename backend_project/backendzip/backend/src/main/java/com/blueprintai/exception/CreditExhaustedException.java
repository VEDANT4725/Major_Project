package com.blueprintai.exception;

public class CreditExhaustedException extends RuntimeException {
    public CreditExhaustedException(String message) {
        super(message);
    }
}
