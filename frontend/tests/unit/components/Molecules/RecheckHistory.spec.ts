import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RecheckHistory from '~/components/Molecules/RecheckHistory.vue';
import type { RecheckExecution } from '~/utils/api';

// Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="p-card"><slot name="title" /><slot name="content" /><slot name="footer" /></div>',
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="p-tag" :class="`p-tag-${severity}`"><slot /></span>',
    props: ['value', 'severity'],
  },
}));

vi.mock('primevue/badge', () => ({
  default: {
    name: 'Badge',
    template: '<span class="p-badge" :class="`p-badge-${severity}`">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button class="p-button" :class="`p-button-${severity}`" :disabled="loading"><slot /></button>',
    props: ['label', 'icon', 'size', 'severity', 'loading'],
    emits: ['click'],
  },
}));

describe('RecheckHistory', () => {
  const mockExecutionHistory: RecheckExecution[] = [
    {
      id: 1,
      executionId: 'exec-123',
      status: 'completed',
      checkTypes: ['branch', 'clone', 'gitleaks'],
      startedAt: '2024-01-01T10:00:00Z',
      completedAt: '2024-01-01T10:05:00Z',
      durationSeconds: 300,
    },
    {
      id: 2,
      executionId: 'exec-456',
      status: 'running',
      checkTypes: ['branch', 'issue'],
      startedAt: '2024-01-01T11:00:00Z',
    },
    {
      id: 3,
      executionId: 'exec-789',
      status: 'error',
      checkTypes: ['clone'],
      startedAt: '2024-01-01T12:00:00Z',
      completedAt: '2024-01-01T12:01:00Z',
      durationSeconds: 60,
      errorMessage: 'Connection failed',
      errorCode: 'CONNECTION_ERROR',
    },
  ];

  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [],
        },
      });

      expect(wrapper.find('.recheck-history').exists()).toBe(true);
      expect(wrapper.find('.history-card').exists()).toBe(true);
    });

    it('renders with execution history', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      expect(wrapper.find('.history-list').exists()).toBe(true);
      expect(wrapper.findAll('.history-item')).toHaveLength(3);
    });

    it('renders loading state when loading and no history', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [],
          loading: true,
        },
      });

      expect(wrapper.find('.loading-state').exists()).toBe(true);
      expect(wrapper.find('.loading-icon').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading history...');
    });

    it('renders empty state when no history and not loading', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [],
          loading: false,
        },
      });

      expect(wrapper.find('.empty-state').exists()).toBe(true);
      expect(wrapper.find('.empty-icon').exists()).toBe(true);
      expect(wrapper.text()).toContain('No execution history available');
    });

    it('renders count badge with correct value', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      const badge = wrapper.findComponent({ name: 'Badge' });
      expect(badge.props('value')).toBe('3');
      expect(badge.props('severity')).toBe('info');
    });
  });

  describe('execution items', () => {
    it('renders execution items with correct data', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      const items = wrapper.findAll('.history-item');
      
      // First item (completed)
      expect(items[0].find('.execution-id').text()).toBe('exec-123');
      expect(items[0].findComponent({ name: 'Tag' }).props('value')).toBe('completed');
      expect(items[0].find('.check-types').text()).toContain('Checks:');
      expect(items[0].find('.duration').text()).toContain('5m');
      
      // Second item (running)
      expect(items[1].find('.execution-id').text()).toBe('exec-456');
      expect(items[1].findComponent({ name: 'Tag' }).props('value')).toBe('running');
      expect(items[1].find('.check-types').text()).toContain('Checks:');
      
      // Third item (error)
      expect(items[2].find('.execution-id').text()).toBe('exec-789');
      expect(items[2].findComponent({ name: 'Tag' }).props('value')).toBe('error');
      expect(items[2].find('.error-message').text()).toBe('Connection failed');
    });

    it('applies correct status classes', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      const items = wrapper.findAll('.history-item');
      
      expect(items[0].classes()).toContain('status-completed');
      expect(items[1].classes()).toContain('status-running');
      expect(items[2].classes()).toContain('status-error');
    });

    it('renders check types correctly', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [mockExecutionHistory[0]],
        },
      });

      const checkTypes = wrapper.find('.check-types');
      expect(checkTypes.text()).toContain('Checks:');
    });

    it('renders duration correctly for completed executions', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [mockExecutionHistory[0]],
        },
      });

      const duration = wrapper.find('.duration');
      expect(duration.text()).toContain('5m');
    });

    it('renders error message for failed executions', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: [mockExecutionHistory[2]],
        },
      });

      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.text()).toBe('Connection failed');
    });
  });

  describe('footer actions', () => {
    it('renders refresh button', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('label')).toBe('Refresh');
      expect(refreshButton.props('icon')).toBe('pi pi-refresh');
      expect(refreshButton.props('severity')).toBe('secondary');
    });

    it('renders load more button when hasMore is true', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
          hasMore: true,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const loadMoreButton = buttons.find(btn => btn.props('label') === 'Load More');
      
      expect(loadMoreButton).toBeDefined();
      expect(loadMoreButton?.props('icon')).toBe('pi pi-angle-down');
    });

    it('does not render load more button when hasMore is false', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
          hasMore: false,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const loadMoreButton = buttons.find(btn => btn.props('label') === 'Load More');
      
      expect(loadMoreButton).toBeUndefined();
    });
  });

  describe('events', () => {
    it('emits refresh event when refresh button is clicked', async () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      await refreshButton.vm.$emit('click');

      expect(wrapper.emitted('refresh')).toBeTruthy();
      expect(wrapper.emitted('refresh')).toHaveLength(1);
    });

    it('emits load-more event when load more button is clicked', async () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
          hasMore: true,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const loadMoreButton = buttons.find(btn => btn.props('label') === 'Load More');
      
      await loadMoreButton?.vm.$emit('click');

      expect(wrapper.emitted('load-more')).toBeTruthy();
      expect(wrapper.emitted('load-more')).toHaveLength(1);
    });
  });

  describe('loading state', () => {
    it('shows loading state on refresh button when loading', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
          loading: true,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('loading')).toBe(true);
    });

    it('does not show loading state on refresh button when not loading', () => {
      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: mockExecutionHistory,
          loading: false,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('loading')).toBe(false);
    });
  });

  describe('duration formatting', () => {
    it('formats duration correctly for different time periods', () => {
      const executions: RecheckExecution[] = [
        {
          id: 1,
          executionId: 'exec-1',
          status: 'completed',
          checkTypes: ['branch'],
          startedAt: '2024-01-01T10:00:00Z',
          completedAt: '2024-01-01T10:00:30Z',
          durationSeconds: 30,
        },
        {
          id: 2,
          executionId: 'exec-2',
          status: 'completed',
          checkTypes: ['branch'],
          startedAt: '2024-01-01T10:00:00Z',
          completedAt: '2024-01-01T10:05:00Z',
          durationSeconds: 300,
        },
        {
          id: 3,
          executionId: 'exec-3',
          status: 'completed',
          checkTypes: ['branch'],
          startedAt: '2024-01-01T10:00:00Z',
          completedAt: '2024-01-01T11:30:00Z',
          durationSeconds: 5400,
        },
      ];

      const wrapper = mount(RecheckHistory, {
        props: {
          executionHistory: executions,
        },
      });

      const durations = wrapper.findAll('.duration');
      expect(durations[0].text()).toContain('30s');
      expect(durations[1].text()).toContain('5m');
      expect(durations[2].text()).toContain('1h 30m');
    });
  });
});
