/**
 * Unit tests for BeanIndex
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { BeanIndex } from '../../../spring-bean-navigation/models/BeanIndex';
import { BeanFactory } from './fixtures/BeanFactory';
import { InjectionType } from '../../../spring-bean-navigation/models/types';

suite('BeanIndex Test Suite', () => {
  let index: BeanIndex;

  setup(() => {
    index = new BeanIndex();
  });

  test('should add and find bean by type', () => {
    const bean = BeanFactory.createServiceBean('userService', 'com.example.UserService');
    index.addBeans([bean]);

    const found = index.findDefinitionsByType('com.example.UserService');
    assert.strictEqual(found.length, 1, 'Should find one bean');
    assert.strictEqual(found[0].name, 'userService', 'Bean name should match');
  });

  test('should add and find bean by name', () => {
    const bean = BeanFactory.createServiceBean('userService', 'com.example.UserService');
    index.addBeans([bean]);

    const found = index.findDefinitionByName('userService');
    assert.ok(found, 'Should find bean by name');
    assert.strictEqual(found?.type, 'com.example.UserService', 'Bean type should match');
  });

  test('should find multiple beans of same type', () => {
    const bean1 = BeanFactory.createServiceBean('service1', 'com.example.Service');
    const bean2 = BeanFactory.createServiceBean('service2', 'com.example.Service');
    index.addBeans([bean1, bean2]);

    const found = index.findDefinitionsByType('com.example.Service');
    assert.strictEqual(found.length, 2, 'Should find two beans');
  });

  test('should find candidates by type match', () => {
    const bean = BeanFactory.createServiceBean('userService', 'com.example.UserService');
    index.addBeans([bean]);

    const injection = BeanFactory.createFieldInjection('com.example.UserService', 'userService');

    const candidates = index.findCandidates(injection);
    assert.strictEqual(candidates.length, 1, 'Should find one candidate');
    assert.strictEqual(candidates[0].beanDefinition.name, 'userService', 'Candidate name should match');
  });

  test('should prioritize @Primary bean', () => {
    const bean1 = BeanFactory.createServiceBean('service1', 'com.example.Service');
    const bean2 = BeanFactory.createPrimaryBean('service2', 'com.example.Service');
    bean2.annotationType = '@Service';

    index.addBeans([bean1, bean2]);

    const injection = BeanFactory.createFieldInjection('com.example.Service', 'service');

    const candidates = index.findCandidates(injection);
    assert.strictEqual(candidates.length, 1, 'Should return only primary bean');
    assert.strictEqual(candidates[0].beanDefinition.name, 'service2', 'Primary bean should be returned');
  });

  test('should find candidate by qualifier', () => {
    const bean = BeanFactory.createQualifiedBean('userService', 'com.example.Service', 'primary');
    index.addBeans([bean]);

    const injection = BeanFactory.createFieldInjection('com.example.Service', 'userService');
    injection.qualifier = 'primary';

    const candidates = index.findCandidates(injection);
    assert.strictEqual(candidates.length, 1, 'Should find qualified bean');
    assert.strictEqual(candidates[0].matchScore, 100, 'Qualifier match should have score 100');
  });

  test('should remove bean by name', () => {
    const bean = BeanFactory.createServiceBean('userService', 'com.example.UserService');
    index.addBeans([bean]);

    index.removeBeans(['userService']);

    const found = index.findDefinitionByName('userService');
    assert.strictEqual(found, undefined, 'Bean should be removed');
  });

  test('should remove file entries', () => {
    const bean = BeanFactory.createServiceBean('userService', 'com.example.UserService');
    index.addBeans([bean]);

    const filePath = bean.location.uri.fsPath;
    index.removeFileEntries(filePath);

    const found = index.findDefinitionByName('userService');
    assert.strictEqual(found, undefined, 'File entries should be removed');
  });

  test('should return empty array for non-existent type', () => {
    const found = index.findDefinitionsByType('com.example.NonExistent');
    assert.strictEqual(found.length, 0, 'Should return empty array');
  });

  test('should get stats', () => {
    const bean1 = BeanFactory.createServiceBean('service1', 'com.example.Service1');
    const bean2 = BeanFactory.createServiceBean('service2', 'com.example.Service2');
    index.addBeans([bean1, bean2]);

    const stats = index.getStats();
    assert.strictEqual(stats.totalBeans, 2, 'Should have 2 beans');
    assert.ok(stats.cacheSize > 0, 'Cache size should be positive');
  });
});
