import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { config } from '@vue/test-utils'
import { h } from 'vue'

// Make mount available globally
declare global {
  var mount: typeof import('@vue/test-utils').mount
}

global.mount = mount

// Mock PrimeVue components globally
const DataTable = {
  name: 'DataTable',
  template: '<div class="p-datatable"><slot /></div>',
  props: {
    value: Array,
    loading: Boolean,
    stripedRows: Boolean,
    responsiveLayout: String,
    class: String,
    sortMode: String,
    sortField: String,
    sortOrder: Number
  },
  emits: ['sort'],
}

const Column = {
  name: 'Column',
  template: '<div class="p-column"><slot name="body" :data="{ issueTypeCounts: { missingSp: 0, largeSp: 0, missingEndDate: 0, notInProject: 0, templateOnly: 0, unclearInstruction: 0, unassigned: 0 }, totalAlerts: 0, author: \'test\' }" /><slot /></div>',
  props: ['field', 'header', 'sortable', 'class'],
}

const Button = {
  name: 'Button',
  template: '<button class="p-button" :class="`p-button-${severity}`" :disabled="disabled" @click="$emit(\'click\', $event)"><i v-if="icon" :class="icon"></i><slot /></button>',
  props: ['icon', 'severity', 'text', 'size', 'class', 'disabled'],
  emits: ['click'],
}

const Paginator = {
  name: 'Paginator',
  template: '<div class="p-paginator"></div>',
  props: ['first', 'rows', 'totalRecords'],
  emits: ['page'],
}

const BaseText = {
  name: 'BaseText',
  props: ['text', 'loading'],
  template: '<div class="base-text">{{ text }}</div>'
}

const BaseTag = {
  name: 'BaseTag',
  template: '<span class="base-tag">{{ value }}</span>',
  props: ['value', 'size'],
}

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: any) => value,
  $n: (value: any) => value,
}

// Register PrimeVue components globally for tests
config.global.components = {
  DataTable,
  Column,
  Button,
  Paginator,
  BaseText,
  BaseTag,
}

// Register global directives
config.global.directives = {
  tooltip: {
    mounted() {},
    updated() {},
    unmounted() {}
  }
}

// Mock process.client for browser environment
Object.defineProperty(process, 'client', {
  value: false,
  writable: true
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true
})

// Set test environment variables
process.env.NUXT_PUBLIC_API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// Global mocks
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
} 