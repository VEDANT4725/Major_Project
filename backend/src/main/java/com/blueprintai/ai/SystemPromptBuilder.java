package com.blueprintai.ai;

import com.blueprintai.model.dto.response.ProjectFilesResponse.ProjectFile;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class SystemPromptBuilder {

    private static final String SYSTEM_PROMPT = """
            You are Blueprint AI, an expert React/TypeScript/Tailwind CSS code generator.
            
            RULES:
            1. Output ALL code changes wrapped in <files> XML blocks:
               <files>
               <file path="src/Component.tsx">
               // full file content
               </file>
               </files>
            
            2. Only output files that changed, but provide FULL file content (no partial updates).
            
            3. Ensure all JSON files are valid (no trailing commas).
            
            4. Follow React + TypeScript + Tailwind CSS project conventions:
               - Use functional components with hooks
               - Use TypeScript interfaces for props
               - Use Tailwind utility classes for styling
               - Use Lucide React for icons
               - Use modern React patterns (useState, useEffect, useCallback)
            
            5. Use premium UI patterns:
               - Gradients and glass effects
               - Smooth animations and transitions
               - Responsive design (mobile-first)
               - Clean typography and spacing
            
            6. When adding new dependencies, update package.json accordingly.
            
            7. Use <task status="pending|in_progress|completed">description</task> tags
               to show progress during multi-step changes.
            
            8. After the </files> tag, provide a clear explanation of what you changed
               and why, in plain English.
            
            9. NEVER use markdown code fences. Only use the <files> XML format.
            """;

    public String buildSystemPrompt(List<ProjectFile> existingFiles,
                                    List<String> selectedFiles) {
        StringBuilder prompt = new StringBuilder(SYSTEM_PROMPT);

        if (existingFiles != null && !existingFiles.isEmpty()) {
            prompt.append("\n\n## CURRENT PROJECT FILES:\n");
            for (ProjectFile file : existingFiles) {
                prompt.append("- ").append(file.getPath()).append("\n");
            }
        }

        if (selectedFiles != null && !selectedFiles.isEmpty()) {
            boolean includeAll = selectedFiles.contains("codebase") ||
                                 selectedFiles.contains("*");

            if (includeAll && existingFiles != null) {
                prompt.append("\n\n## ATTACHED FILE CONTEXTS (full codebase):\n");
                for (ProjectFile file : existingFiles) {
                    prompt.append("<file_content path=\"").append(file.getPath()).append("\">\n");
                    prompt.append(file.getContent());
                    prompt.append("\n</file_content>\n\n");
                }
            } else {
                prompt.append("\n\n## ATTACHED FILE CONTEXTS:\n");
                Set<String> selectedSet = new HashSet<>(selectedFiles);
                if (existingFiles != null) {
                    for (ProjectFile file : existingFiles) {
                        if (selectedSet.contains(file.getPath())) {
                            prompt.append("<file_content path=\"").append(file.getPath()).append("\">\n");
                            prompt.append(file.getContent());
                            prompt.append("\n</file_content>\n\n");
                        }
                    }
                }
            }
        }

        return prompt.toString();
    }

    public List<Map<String, String>> prepareChatHistory(
            List<Map<String, Object>> messages, int maxMessages, int maxLength) {
        int start = Math.max(0, messages.size() - maxMessages);
        return messages.subList(start, messages.size()).stream()
                .map(msg -> {
                    Map<String, String> result = new HashMap<>();
                    result.put("role", (String) msg.get("role"));
                    String content = (String) msg.get("content");
                    if (content != null && content.length() > maxLength) {
                        content = content.substring(0, maxLength) + "...";
                    }
                    result.put("content", content);
                    return result;
                })
                .collect(Collectors.toList());
    }
}
