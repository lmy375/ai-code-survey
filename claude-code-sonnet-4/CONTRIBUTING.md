# Contributing to Shell MCP

Thank you for your interest in contributing to Shell MCP! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/shell-mcp.git
   cd shell-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Development Commands

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with tsx
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain 80-character line length where reasonable

## Testing

- Write unit tests for new features
- Write integration tests for end-to-end functionality
- Ensure all tests pass before submitting
- Aim for high test coverage

## Security Considerations

When contributing, please keep security in mind:

- Never introduce code that could enable command injection
- Validate all user inputs
- Use the existing security validation patterns
- Test security boundaries thoroughly

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request with a clear description

## Commit Message Format

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `chore:` for maintenance tasks

Example: `feat: add support for custom timeout configuration`

## Reporting Issues

When reporting issues:
- Use a clear, descriptive title
- Provide steps to reproduce
- Include system information (OS, Node.js version)
- Include relevant error messages and logs
- Provide minimal example code if possible

## Feature Requests

For feature requests:
- Explain the use case and motivation
- Provide examples of how it would be used
- Consider backward compatibility
- Discuss potential security implications

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain professional communication

## Questions

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Ask in pull request comments
- Open an issue with the "question" label

Thank you for contributing to Shell MCP!