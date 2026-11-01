package com.blueprintai.ai;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

@Component
public class FileParser {

    private static final Pattern FILES_BLOCK_PATTERN =
            Pattern.compile("<files>(.*?)</files>", Pattern.DOTALL);
    private static final Pattern FILE_PATTERN =
            Pattern.compile("<file path=\"([^\"]+)\">(.*?)</file>", Pattern.DOTALL);
    private static final Pattern TASK_PATTERN =
            Pattern.compile("<task status=\"(pending|in_progress|completed)\">([^<]*)</task>");
    private static final Pattern EXTENSION_PATTERN =
            Pattern.compile("\\.(tsx|ts|jsx|js|css|json|html|svg|mjs|env|env\\..*)$");

    private static final Set<String> VALID_EXTENSIONS = Set.of(
            ".tsx", ".ts", ".jsx", ".js", ".css", ".json",
            ".html", ".svg", ".mjs", ".env", ".env.local",
            ".env.development", ".env.production"
    );

    public List<Map<String, String>> parseFilesFromResponse(String response) {
        List<Map<String, String>> files = new ArrayList<>();
        Set<String> seenPaths = new HashSet<>();

        Matcher filesMatcher = FILES_BLOCK_PATTERN.matcher(response);
        while (filesMatcher.find()) {
            String block = filesMatcher.group(1);
            Matcher fileMatcher = FILE_PATTERN.matcher(block);
            while (fileMatcher.find()) {
                String path = normalizePath(fileMatcher.group(1));
                String content = fileMatcher.group(2);

                if (isValidFilePath(path)) {
                    content = sanitizeFileContent(path, content);
                    if (seenPaths.contains(path)) {
                        files.removeIf(f -> f.get("path").equals(path));
                    }
                    files.add(Map.of("path", path, "content", content));
                    seenPaths.add(path);
                }
            }
        }

        if (files.isEmpty()) {
            files = parseStreamingFiles(response);
        }

        return files;
    }

    public List<Map<String, String>> parseStreamingFiles(String response) {
        List<Map<String, String>> files = new ArrayList<>();
        Set<String> seenPaths = new HashSet<>();

        Matcher fileMatcher = FILE_PATTERN.matcher(response);
        while (fileMatcher.find()) {
            String path = normalizePath(fileMatcher.group(1));
            String content = fileMatcher.group(2);

            if (isValidFilePath(path)) {
                content = sanitizeFileContent(path, content);
                if (seenPaths.contains(path)) {
                    files.removeIf(f -> f.get("path").equals(path));
                }
                files.add(Map.of("path", path, "content", content));
                seenPaths.add(path);
            }
        }

        return files;
    }

    public String extractExplanation(String response) {
        int lastFilesClose = response.lastIndexOf("</files>");
        if (lastFilesClose >= 0) {
            return response.substring(lastFilesClose + 8).trim();
        }
        return response.trim();
    }

    public List<Map<String, String>> mergeFiles(List<Map<String, String>> existing,
                                                 List<Map<String, String>> newFiles) {
        Map<String, String> fileMap = new LinkedHashMap<>();

        if (existing != null) {
            for (Map<String, String> file : existing) {
                fileMap.put(file.get("path"), file.get("content"));
            }
        }

        for (Map<String, String> file : newFiles) {
            fileMap.put(file.get("path"), file.get("content"));
        }

        return fileMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.of("path", e.getKey(), "content", e.getValue()))
                .collect(Collectors.toList());
    }

    public List<Map<String, String>> extractTasks(String response) {
        List<Map<String, String>> tasks = new ArrayList<>();
        Matcher matcher = TASK_PATTERN.matcher(response);
        while (matcher.find()) {
            tasks.add(Map.of(
                    "status", matcher.group(1),
                    "description", matcher.group(2).trim()
            ));
        }
        return tasks;
    }

    public boolean hasFiles(String response) {
        return FILES_BLOCK_PATTERN.matcher(response).find() ||
               FILE_PATTERN.matcher(response).find();
    }

    private String normalizePath(String path) {
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        return path;
    }

    private boolean isValidFilePath(String path) {
        if (path.contains("..") || path.contains("~")) {
            return false;
        }

        Matcher extMatcher = EXTENSION_PATTERN.matcher(path);
        if (!extMatcher.find()) {
            return false;
        }

        String lower = path.toLowerCase();
        return lower.startsWith("src/") || lower.startsWith("public/") ||
               lower.equals("package.json") || lower.equals("tsconfig.json") ||
               lower.equals("tailwind.config.js") || lower.equals("tailwind.config.ts") ||
               lower.equals("postcss.config.js") || lower.equals("postcss.config.mjs") ||
               lower.equals("components.json") || lower.startsWith(".env");
    }

    private String sanitizeFileContent(String path, String content) {
        if (path.endsWith(".json")) {
            content = content.replaceAll(",\\s*([}\\]])", "$1");
        }
        return content;
    }
}
