import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RecheckButton from '~/components/Atoms/RecheckButton.vue';

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button class="p-button" :class="`p-button-${severity}`" :disabled="disabled" :loading="loading"><i v-if="icon" :class="icon"></i><slot>{{ label }}</slot></button>',
    props: ['label', 'icon', 'loading', 'disabled', 'severity', 'size'],
    emits: ['click'],
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="p-tag" :class="`p-tag-${severity}`"><i v-if="icon" :class="icon"></i><slot>{{ value }}</slot></span>',
    props: ['value', 'severity', 'icon'],
  },
}));

describe('RecheckButton', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RecheckButton);

      expect(wrapper.find('.recheck-button-container').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
    });

    it('renders with custom props', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
          canExecute: false,
          status: 'running',
          retryAfterSeconds: 30,
          showStatus: true,
          size: 'large',
        },
      });

      expect(wrapper.find('.recheck-button-container').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
    });
  });

  describe('button label', () => {
    it('shows "Running..." when loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('Running...');
    });

    it('shows "Running..." when status is running', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'running',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('Running...');
    });

    it('shows "ReCheck" when status is completed', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'completed',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('ReCheck');
    });

    it('shows "Retry" when status is error', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'error',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('Retry');
    });

    it('shows wait time when cannot execute and retry after seconds', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: false,
          retryAfterSeconds: 120,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('Wait 2m');
    });

    it('shows "ReCheck" by default', () => {
      const wrapper = mount(RecheckButton);

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('label')).toBe('ReCheck');
    });
  });

  describe('button icon', () => {
    it('shows spinner when loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-spin pi-spinner');
    });

    it('shows spinner when status is running', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'running',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-spin pi-spinner');
    });

    it('shows refresh icon when status is completed', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'completed',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-refresh');
    });

    it('shows replay icon when status is error', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'error',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-replay');
    });

    it('shows clock icon when cannot execute and retry after seconds', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: false,
          retryAfterSeconds: 30,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-clock');
    });

    it('shows refresh icon by default', () => {
      const wrapper = mount(RecheckButton);

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('icon')).toBe('pi pi-refresh');
    });
  });

  describe('button severity', () => {
    it('shows info severity when loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('severity')).toBe('info');
    });

    it('shows info severity when status is running', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'running',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('severity')).toBe('info');
    });

    it('shows warn severity when status is error', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'error',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('severity')).toBe('warn');
    });

    it('shows warning severity when cannot execute and retry after seconds', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: false,
          retryAfterSeconds: 30,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('severity')).toBe('warning');
    });

    it('shows secondary severity by default', () => {
      const wrapper = mount(RecheckButton);

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('severity')).toBe('secondary');
    });
  });

  describe('button disabled state', () => {
    it('is disabled when cannot execute', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: false,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('disabled')).toBe(true);
    });

    it('is disabled when loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('disabled')).toBe(true);
    });

    it('is enabled when can execute and not loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: true,
          loading: false,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('disabled')).toBe(false);
    });
  });

  describe('status indicator', () => {
    it('shows status indicator when showStatus is true and status is provided', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          showStatus: true,
          status: 'running',
        },
      });

      expect(wrapper.find('.status-indicator').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Tag' }).exists()).toBe(true);
    });

    it('does not show status indicator when showStatus is false', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          showStatus: false,
          status: 'running',
        },
      });

      expect(wrapper.find('.status-indicator').exists()).toBe(false);
    });

    it('does not show status indicator by default (showStatus defaults to false)', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          status: 'running',
        },
      });

      expect(wrapper.find('.status-indicator').exists()).toBe(false);
    });

    it('shows correct status text for different statuses', () => {
      const statuses = [
        { status: 'running', expectedText: 'Running' },
        { status: 'completed', expectedText: 'Completed' },
        { status: 'error', expectedText: 'Error' },
        { status: 'idle', expectedText: 'Ready' },
      ];

      statuses.forEach(({ status, expectedText }) => {
        const wrapper = mount(RecheckButton, {
          props: {
            showStatus: true,
            status: status as any,
          },
        });

        const tag = wrapper.findComponent({ name: 'Tag' });
        expect(tag.props('value')).toBe(expectedText);
      });
    });

    it('shows correct status severity for different statuses', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          showStatus: true,
          status: 'error',
        },
      });

      const tag = wrapper.findComponent({ name: 'Tag' });
      expect(tag.props('severity')).toBe('danger');
    });
  });

  describe('retry countdown', () => {
    it('shows retry countdown when retryAfterSeconds is greater than 0', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          retryAfterSeconds: 120,
        },
      });

      expect(wrapper.find('.retry-countdown').exists()).toBe(true);
      expect(wrapper.text()).toContain('Retry available in 2m');
    });

    it('does not show retry countdown when retryAfterSeconds is 0', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          retryAfterSeconds: 0,
        },
      });

      expect(wrapper.find('.retry-countdown').exists()).toBe(false);
    });

    it('formats countdown correctly for different time periods', () => {
      const testCases = [
        { seconds: 30, expected: '30s' },
        { seconds: 60, expected: '1m' },
        { seconds: 90, expected: '1m 30s' },
        { seconds: 3600, expected: '1h' },
        { seconds: 3660, expected: '1h 1m' },
      ];

      testCases.forEach(({ seconds, expected }) => {
        const wrapper = mount(RecheckButton, {
          props: {
            retryAfterSeconds: seconds,
          },
        });

        expect(wrapper.text()).toContain(`Retry available in ${expected}`);
      });
    });
  });

  describe('events', () => {
    it('emits click event when button is clicked', async () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: true,
          loading: false,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      await button.vm.$emit('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('does not emit click event when button is disabled', async () => {
      const wrapper = mount(RecheckButton, {
        props: {
          canExecute: false,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      await button.vm.$emit('click');

      // Even if the button emits click, the component should not emit it when disabled
      expect(wrapper.emitted('click')).toBeFalsy();
    });
  });

  describe('size prop', () => {
    it('passes size prop to button', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          size: 'large',
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('size')).toBe('large');
    });

    it('uses default size when not provided', () => {
      const wrapper = mount(RecheckButton);

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('size')).toBe('normal');
    });
  });

  describe('loading state', () => {
    it('passes loading prop to button', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('loading')).toBe(true);
    });

    it('does not pass loading when not loading', () => {
      const wrapper = mount(RecheckButton, {
        props: {
          loading: false,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('loading')).toBe(false);
    });
  });
});
