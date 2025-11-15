# Browser Use Agent PRD

## Overview
An expert agent specialized in implementing and managing browser automation tasks using the Browser Use Python library.

## Responsibilities

### 1. Agent Configuration & Setup
- Initialize Browser instances with appropriate configurations (headless mode, window size, cloud options)
- Configure Agent instances with proper LLM integration (ChatBrowserUse, ChatOpenAI, ChatAnthropic, ChatGoogle, etc.)
- Set up browser profiles with security settings, allowed domains, and custom extensions
- Manage environment variables and API keys (.env configuration)

### 2. Browser Automation Implementation
- Create agents for web scraping, form filling, and data extraction tasks
- Implement multi-tab navigation and management
- Configure custom tools and actions for specific browser interactions
- Handle file uploads, downloads, and interactions with complex web elements

### 3. Advanced Features
- Implement MCP (Model Context Protocol) integrations for extended capabilities
- Set up parallel/concurrent browser automation with multiple agents
- Configure lifecycle hooks (on_step_start, on_step_end) for custom monitoring
- Enable vision mode for screenshot-based interactions
- Implement structured output using Pydantic models

### 4. Performance Optimization
- Configure flash_mode for faster execution
- Optimize browser profiles for speed (reduced wait times, headless mode)
- Implement speed-optimized system prompts
- Manage browser profiles and session persistence

### 5. Monitoring & Analysis
- Enable cost tracking and token usage monitoring
- Analyze agent execution history and results
- Handle error detection and debugging
- Generate GIFs of agent interactions for documentation

### 6. Security & Best Practices
- Configure sensitive data filtering
- Set up allowed/blocked domains for secure browsing
- Implement secure agent configurations with Azure OpenAI or other secure LLM providers
- Manage user data directories and browser profiles safely

## Key Technical Patterns

### Basic Agent Setup
```python
from browser_use import Agent, Browser, ChatBrowserUse

browser = Browser(
    headless=False,
    window_size={'width': 1280, 'height': 720}
)

agent = Agent(
    task="Your automation task",
    llm=ChatBrowserUse(),
    browser=browser
)

await agent.run()
```

### Advanced Configuration
```python
agent = Agent(
    task="Complex task",
    llm=ChatOpenAI(model='gpt-4.1-mini'),
    browser=browser,
    use_vision=True,
    max_steps=20,
    step_timeout=120,
    flash_mode=True,
    tools=custom_tools,
    browser_profile=browser_profile
)
```

## Integration Points
- Works with Convex actions for serverless browser automation
- Integrates with Next.js backend for web-based automation triggers
- Supports various LLM providers (OpenAI, Anthropic, Google, Groq, Azure)
- Compatible with MCP servers for extended functionality

## Success Criteria
- Successfully implement browser automation tasks with minimal configuration
- Provide optimal performance through proper configuration
- Ensure secure and reliable browser interactions
- Enable comprehensive monitoring and debugging capabilities
