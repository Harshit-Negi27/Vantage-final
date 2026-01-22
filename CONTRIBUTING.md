# Contributing to Vantage

Thank you for your interest in contributing to Vantage. This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/vantage.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "Add feature: description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

Follow the setup guides in the `docs/` directory:

- [Frontend Setup](./docs/FRONTEND_SETUP.md)
- [Backend Setup](./docs/BACKEND_SETUP.md)
- [AI Server Setup](./docs/AI_SERVER_SETUP.md)

## Project Structure

```
vantage/
├── frontend/       # Next.js frontend
├── backend/        # Express.js API
├── Vantage/        # Python AI server
└── docs/           # Documentation
```

## Coding Standards

### Frontend (TypeScript/React)

- Use TypeScript for type safety
- Follow React best practices and hooks guidelines
- Use functional components
- Keep components small and focused
- Use Tailwind CSS for styling
- Format with Prettier
- Lint with ESLint

### Backend (Node.js)

- Use ES modules (import/export)
- Use async/await for asynchronous code
- Handle errors properly
- Validate inputs
- Add JSDoc comments for functions
- Follow Express.js best practices

### AI Server (Python)

- Follow PEP 8 style guide
- Use type hints
- Add docstrings to functions and classes
- Use async/await for async operations
- Handle exceptions properly
- Keep functions focused and small

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases and error conditions
- Test across different environments

### Running Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test

# AI Server
cd Vantage
pytest
```

## Documentation

- Update documentation for new features
- Add JSDoc/docstrings to code
- Update README if needed
- Add examples for new APIs
- Keep documentation clear and concise

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG if applicable
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## Pull Request Guidelines

- One feature/fix per PR
- Clear title and description
- Reference related issues
- Include screenshots for UI changes
- Keep changes focused and minimal
- Ensure CI passes

## Commit Messages

Use clear, descriptive commit messages:

```
Add feature: user authentication
Fix bug: chart rendering on mobile
Update docs: API endpoint examples
Refactor: simplify node creation logic
```

## Issue Reporting

When reporting issues:

- Use issue templates if available
- Provide clear title and description
- Include steps to reproduce
- Add error messages and logs
- Specify environment details
- Add screenshots if relevant

## Feature Requests

When requesting features:

- Explain the use case
- Describe expected behavior
- Consider implementation complexity
- Discuss alternatives
- Be open to feedback

## Code Review

When reviewing code:

- Be constructive and respectful
- Focus on code quality and correctness
- Suggest improvements
- Ask questions for clarity
- Approve when satisfied

## Areas for Contribution

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage
- UI/UX enhancements
- Accessibility improvements
- Internationalization
- Example projects
- Tutorials and guides

## Questions?

If you have questions:

- Check existing documentation
- Search existing issues
- Open a new issue with the "question" label
- Join community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Vantage!
