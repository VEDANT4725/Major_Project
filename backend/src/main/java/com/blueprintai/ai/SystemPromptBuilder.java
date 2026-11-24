package com.blueprintai.ai;

import com.blueprintai.model.dto.response.ProjectFilesResponse.ProjectFile;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class SystemPromptBuilder {

    private static final String SYSTEM_PROMPT = """
            You are Blueprint AI, an expert React/TypeScript/Tailwind CSS code generator.

            CRITICAL INSTRUCTION - EXISTING PROJECT EDITING:
            - If existing project files are provided, you MUST EDIT the existing project, NOT create a new one
            - Preserve the current project's structure, theme, and overall design
            - Only modify the specific parts the user requests to change
            - Do NOT recreate the entire application unless user explicitly says "create a new project" or "start from scratch"
            - When user says "add [feature]", "update [element]", "change [color/style]", etc., this is an EDIT request
            - Only rebuild the entire application if user explicitly uses words like "create", "build", "make a new" for a different topic/theme

            RULES:
            1. Output ALL code changes wrapped in <files> XML blocks:
               <files>
               <file path="src/Component.tsx">
               // full file content
               </file>
               </files>

            2. Only output files that changed, but provide FULL file content (no partial updates).
               - On initial generation, always replace the starter src/App.tsx and connect the
                 generated pages/components so the requested app is rendered from its entry point.
               - Do not leave generated components unused or leave "Your project is ready to go!"
                 in the active app entry point after building the requested project.
               - When editing existing projects, only output files that actually changed to reduce noise

            3. Ensure all JSON files are valid (no trailing commas).
            
            4. Follow React + TypeScript + Tailwind CSS project conventions:
               - Use functional components with hooks
               - Use TypeScript interfaces for props
               - Use Tailwind utility classes for styling
               - Use Lucide React for icons
               - Use modern React patterns (useState, useEffect, useCallback)
               - Use valid, case-sensitive named exports from lucide-react (the GitHub icon is named Github).
               - Verify every imported component and icon is actually exported by its package or project file.
               - Match default imports to default exports and named imports to named exports.
            
            5. Treat visual quality as a core requirement:
               - First infer the product's audience and choose a distinctive art direction, palette,
                 typography, and layout that fit the requested domain. Do not reuse a generic template.
               - Build a complete, polished page rather than stopping at a hero: include a useful
                 navigation, a strong hero, several relevant content sections, clear calls to action,
                 and a finished footer. Adapt the sections to the product; never add filler.
               - Use a clear visual hierarchy, intentional whitespace, consistent spacing, readable
                 contrast, and responsive layouts that work on both mobile and desktop.
               - Use relevant imagery where it improves the design, with meaningful alt text. Avoid
                 empty image placeholders, excessive gradients, and glass effects that do not suit
                 the brand.
               - Add subtle interactions and hover/focus states where useful. Prefer existing
                 dependencies and keep the result functional, not just decorative.
               - For a cafe or restaurant, make the page feel like a real venue: show the menu or
                 signature items, atmosphere, location or hours, and an inviting way to visit/order.
            
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
