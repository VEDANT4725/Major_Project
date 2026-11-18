package com.blueprintai.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FileParserTest {

    private final FileParser fileParser = new FileParser();

    @Test
    void hidesSourceCodeAppendedAfterFilesBlock() {
        String response = """
                <files><file path="src/App.tsx">export default function App() { return null; }</file></files>
                Project updated successfully.
                ```tsx
                import React from 'react';
                export interface Props {}
                export const App = () => <div />;
                ```
                """;

        assertEquals(
                "Project files generated and applied successfully.",
                fileParser.extractExplanation(response));
    }

    @Test
    void preservesPlainTextExplanationAfterFilesBlock() {
        String response = """
                <files><file path="src/App.tsx">export default function App() { return null; }</file></files>
                Updated the dashboard and added responsive navigation.
                """;

        assertEquals(
                "Updated the dashboard and added responsive navigation.",
                fileParser.extractExplanation(response));
    }
}
