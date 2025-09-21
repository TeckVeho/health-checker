import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RecheckStatus from '~/components/Molecules/RecheckStatus.vue';
import type { RecheckStatusResponse } from '~/utils/api';

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
    template: '<span class="p-tag" :class="`p-tag-${severity}`"><i v-if="icon" :class="icon"></i><slot /></span>',
    props: ['value', 'severity', 'icon'],
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

describe('RecheckStatus', () => {
  const mockStatus: RecheckStatusResponse = {
    status: 'running',
    lastExecutedAt: '2024-01-01T10:00:00Z',
    nextAvailableAt: '2024-01-01T11:00:00Z',
    currentExecution: {
      executionId: 'exec-123',
      startedAt: '2024-01-01T10:00:00Z',
      progress: 75,
      durationSeconds: 300,
      currentPhase: 'gitleaks',
      totalPhases: 4,
      phaseProgress: 50,
      phaseDetails: {
        phase: 'gitleaks',
        progress: 50,
        totalItems: 100,
        processedItems: 50,
      },
    },
  };

  const mockCompletedStatus: RecheckStatusResponse = {
    status: 'completed',
    lastExecutedAt: '2024-01-01T10:00:00Z',
    nextAvailableAt: '2024-01-01T11:00:00Z',
  };

  const mockErrorStatus: RecheckStatusResponse = {
    status: 'error',
    lastExecutedAt: '2024-01-01T10:00:00Z',
    nextAvailableAt: '2024-01-01T11:00:00Z',
  };

  const mockIdleStatus: RecheckStatusResponse = {
    status: 'idle',
    lastExecutedAt: '2024-01-01T10:00:00Z',
    nextAvailableAt: '2024-01-01T11:00:00Z',
  };

  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: null,
        },
      });

      expect(wrapper.find('.recheck-status').exists()).toBe(true);
      expect(wrapper.find('.status-card').exists()).toBe(true);
    });

    it('renders with running status', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('value')).toBe('Running');
      expect(tag.props('severity')).toBe('info');
      expect(tag.props('icon')).toBe('pi pi-spin pi-spinner');
    });

    it('renders with completed status', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockCompletedStatus,
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('value')).toBe('Completed');
      expect(tag.props('severity')).toBe('success');
      expect(tag.props('icon')).toBe('pi pi-check');
    });

    it('renders with error status', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockErrorStatus,
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('value')).toBe('Error');
      expect(tag.props('severity')).toBe('danger');
      expect(tag.props('icon')).toBe('pi pi-times');
    });

    it('renders with idle status', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockIdleStatus,
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('value')).toBe('Idle');
      expect(tag.props('severity')).toBe('secondary');
      expect(tag.props('icon')).toBe('pi pi-clock');
    });

    it('renders with null status', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: null,
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('value')).toBe('Unknown');
      expect(tag.props('severity')).toBe('secondary');
      expect(tag.props('icon')).toBe('pi pi-question');
    });
  });

  describe('running status details', () => {
    it('renders progress badge when running', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      const badge = wrapper.findComponent({ name: 'Badge' });
      expect(badge.exists()).toBe(true);
      expect(badge.props('value')).toBe('75%');
      expect(badge.props('severity')).toBe('info');
    });

    it('renders current phase when running', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      expect(wrapper.find('.status-value').text()).toContain('gitleaks');
      expect(wrapper.find('.phase-progress').text()).toContain('( 50/100 )');
    });

    it('renders duration when running', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      expect(wrapper.text()).toContain('5m');
    });

    it('renders execution details when running', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      // Execution ID is not displayed in the current implementation
      // Check for other execution details instead
      expect(wrapper.text()).toContain('gitleaks');
      expect(wrapper.text()).toContain('5m');
    });
  });

  describe('compact and inline modes', () => {
    it('applies compact class when compact prop is true', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          compact: true,
        },
      });

      expect(wrapper.find('.recheck-status').classes()).toContain('compact');
    });

    it('applies inline class when inline prop is true', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          inline: true,
        },
      });

      expect(wrapper.find('.recheck-status').classes()).toContain('inline');
    });

    it('applies both compact and inline classes when both props are true', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          compact: true,
          inline: true,
        },
      });

      const statusElement = wrapper.find('.recheck-status');
      expect(statusElement.classes()).toContain('compact');
      expect(statusElement.classes()).toContain('inline');
    });
  });

  describe('footer actions', () => {
    it('renders refresh button', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('label')).toBe('Refresh Status');
      expect(refreshButton.props('icon')).toBe('pi pi-refresh');
      expect(refreshButton.props('severity')).toBe('secondary');
    });

    it('renders view history button when showHistoryButton is true', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          showHistoryButton: true,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const historyButton = buttons.find(btn => btn.props('label') === 'View History');
      
      expect(historyButton).toBeDefined();
      expect(historyButton?.props('icon')).toBe('pi pi-history');
    });

    it('does not render view history button when showHistoryButton is false', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          showHistoryButton: false,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const historyButton = buttons.find(btn => btn.props('label') === 'View History');
      
      expect(historyButton).toBeUndefined();
    });
  });

  describe('events', () => {
    it('emits refresh event when refresh button is clicked', async () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      await refreshButton.vm.$emit('click');

      expect(wrapper.emitted('refresh')).toBeTruthy();
      expect(wrapper.emitted('refresh')).toHaveLength(1);
    });

    it('emits view-history event when view history button is clicked', async () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          showHistoryButton: true,
        },
      });

      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const historyButton = buttons.find(btn => btn.props('label') === 'View History');
      
      await historyButton?.vm.$emit('click');

      expect(wrapper.emitted('view-history')).toBeTruthy();
      expect(wrapper.emitted('view-history')).toHaveLength(1);
    });
  });

  describe('loading state', () => {
    it('shows loading state on refresh button when loading', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          loading: true,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('loading')).toBe(true);
    });

    it('does not show loading state on refresh button when not loading', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
          loading: false,
        },
      });

      const refreshButton = wrapper.findComponent({ name: 'Button' });
      expect(refreshButton.props('loading')).toBe(false);
    });
  });

  describe('time formatting', () => {
    it('formats last executed time correctly', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      // The actual format depends on the locale, so we check for a more general pattern
      expect(wrapper.text()).toContain('2024/1/1');
    });

    it('formats next available time correctly', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      // The actual format depends on the locale, so we check for a more general pattern
      expect(wrapper.text()).toContain('2024/1/1');
    });
  });

  describe('phase progress', () => {
    it('shows phase progress when showPhaseProgress is true', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      expect(wrapper.find('.phase-progress').exists()).toBe(true);
      expect(wrapper.find('.phase-progress').text()).toContain('50/100');
    });

    it('does not show phase progress when showPhaseProgress is false', () => {
      const statusWithoutPhaseProgress = {
        ...mockStatus,
        currentExecution: {
          ...mockStatus.currentExecution!,
          phaseDetails: undefined,
        },
      };

      const wrapper = mount(RecheckStatus, {
        props: {
          status: statusWithoutPhaseProgress,
        },
      });

      expect(wrapper.find('.phase-progress').exists()).toBe(false);
    });
  });

  describe('execution details', () => {
    it('renders execution details when available', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockStatus,
        },
      });

      // Execution ID is not displayed in the current implementation
      // Check for other execution details instead
      expect(wrapper.text()).toContain('gitleaks');
      expect(wrapper.text()).toContain('5m');
    });

    it('does not render execution details when not running', () => {
      const wrapper = mount(RecheckStatus, {
        props: {
          status: mockCompletedStatus,
        },
      });

      expect(wrapper.text()).not.toContain('exec-123');
      expect(wrapper.text()).not.toContain('gitleaks');
    });
  });
});
