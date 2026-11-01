package com.blueprintai.exception;

public class ProjectLimitReachedException extends RuntimeException {
    public ProjectLimitReachedException(String message) {
        super(message);
    }
}
