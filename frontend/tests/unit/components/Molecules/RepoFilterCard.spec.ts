import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RepoFilterCard from '~/components/Molecules/RepoFilterCard.vue';

// Mock PrimeVue components
vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="p-card"><slot name="content" /></div>',
  },
}));

// Mock BaseButton component
vi.mock('@/components/Atoms/buttons/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    template: '<button class="base-button" :class="`base-button-${variant}`" :disabled="loading" :aria-label="ariaLabel" :aria-pressed="ariaPressed" role="switch"><i v-if="icon" :class="icon"></i><slot /></button>',
    props: ['text', 'icon', 'variant', 'outlined', 'ariaLabel', 'ariaPressed', 'role', 'loading'],
    emits: ['click'],
  },
}));

describe('RepoFilterCard', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      expect(wrapper.find('.p-card').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'BaseButton' }).exists()).toBe(true);
    });

    it('renders with custom class', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
          customClass: 'custom-class',
        },
      });

      expect(wrapper.find('.p-card').classes()).toContain('custom-class');
    });

    it('applies default classes', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const card = wrapper.find('.p-card');
      expect(card.classes()).toContain('w-full');
      expect(card.classes()).toContain('shadow-sm');
      expect(card.classes()).toContain('border');
      expect(card.classes()).toContain('border-gray-200');
      expect(card.classes()).toContain('mb-4');
      expect(card.classes()).toContain('rounded-xl');
    });
  });

  describe('button state when showOnlyActive is false', () => {
    it('renders button with OFF state', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('text')).toBe('Only Active Repo: OFF');
      expect(button.props('icon')).toBe('pi pi-times-circle');
      expect(button.props('variant')).toBe('secondary');
      expect(button.props('ariaLabel')).toBe('Toggle active repository filter. Currently disabled');
      expect(button.props('ariaPressed')).toBe(false);
    });

    it('renders button with correct accessibility attributes when OFF', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('role')).toBe('switch');
      expect(button.props('ariaPressed')).toBe(false);
    });
  });

  describe('button state when showOnlyActive is true', () => {
    it('renders button with ON state', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('text')).toBe('Only Active Repo: ON');
      expect(button.props('icon')).toBe('pi pi-check-circle');
      expect(button.props('variant')).toBe('primary');
      expect(button.props('ariaLabel')).toBe('Toggle active repository filter. Currently enabled');
      expect(button.props('ariaPressed')).toBe(true);
    });

    it('renders button with correct accessibility attributes when ON', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('role')).toBe('switch');
      expect(button.props('ariaPressed')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('passes loading prop to button when loading is true', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
          loading: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('loading')).toBe(true);
    });

    it('passes loading prop to button when loading is false', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
          loading: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('loading')).toBe(false);
    });

    it('defaults loading to false when not provided', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('loading')).toBe(false);
    });
  });

  describe('button configuration', () => {
    it('always renders button with correct variant', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('variant')).toBe('secondary');
    });

    it('always has switch role', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('role')).toBe('switch');
    });
  });

  describe('events', () => {
    it('emits toggle-active event when button is clicked', async () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      await button.vm.$emit('click');

      expect(wrapper.emitted('toggle-active')).toBeTruthy();
      expect(wrapper.emitted('toggle-active')).toHaveLength(1);
    });

    it('emits toggle-active event multiple times when clicked multiple times', async () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      
      await button.vm.$emit('click');
      await button.vm.$emit('click');
      await button.vm.$emit('click');

      expect(wrapper.emitted('toggle-active')).toHaveLength(3);
    });
  });

  describe('responsive layout', () => {
    it('applies responsive flex classes', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const content = wrapper.find('.flex');
      expect(content.classes()).toContain('flex-col');
      expect(content.classes()).toContain('md:flex-row');
      expect(content.classes()).toContain('justify-between');
      expect(content.classes()).toContain('items-center');
      expect(content.classes()).toContain('gap-4');
    });
  });

  describe('accessibility', () => {
    it('provides descriptive aria-label for screen readers', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('ariaLabel')).toBe('Toggle active repository filter. Currently enabled');
    });

    it('indicates current state with aria-pressed', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('ariaPressed')).toBe(true);
    });

    it('uses switch role for toggle functionality', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('role')).toBe('switch');
    });
  });

  describe('visual indicators', () => {
    it('shows check icon when active', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('icon')).toBe('pi pi-check-circle');
    });

    it('shows times icon when inactive', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('icon')).toBe('pi pi-times-circle');
    });

    it('uses primary variant when active', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: true,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('variant')).toBe('primary');
    });

    it('uses secondary variant when inactive', () => {
      const wrapper = mount(RepoFilterCard, {
        props: {
          showOnlyActive: false,
        },
      });

      const button = wrapper.findComponent({ name: 'BaseButton' });
      expect(button.props('variant')).toBe('secondary');
    });
  });
});
