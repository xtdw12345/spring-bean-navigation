/**
 * Unit tests for constructor parameter parsing logic
 * Tests parameter extraction from constructor declarations
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Parameter Parser Test Suite', () => {
  test('should parse constructor parameter pattern', () => {
    // Pattern: public ClassName(Type paramName)
    const constructorLine = 'public UserService(UserRepository userRepository) {';
    const pattern = /(\w+)\s+(\w+)\s*[,)]/g;

    const matches = Array.from(constructorLine.matchAll(pattern));
    assert.ok(matches.length > 0, 'Should find parameter matches');

    if (matches[0]) {
      const type = matches[0][1];
      const name = matches[0][2];
      assert.strictEqual(type, 'UserRepository', 'Should extract type');
      assert.strictEqual(name, 'userRepository', 'Should extract parameter name');
    }
  });

  test('should parse multiple constructor parameters', () => {
    const constructorLine = 'public OrderService(OrderRepository orderRepository, PaymentService paymentService) {';
    const pattern = /(\w+)\s+(\w+)\s*[,)]/g;

    const matches = Array.from(constructorLine.matchAll(pattern));
    assert.strictEqual(matches.length, 2, 'Should find two parameters');

    // First parameter
    assert.strictEqual(matches[0][1], 'OrderRepository', 'First parameter type');
    assert.strictEqual(matches[0][2], 'orderRepository', 'First parameter name');

    // Second parameter
    assert.strictEqual(matches[1][1], 'PaymentService', 'Second parameter type');
    assert.strictEqual(matches[1][2], 'paymentService', 'Second parameter name');
  });

  test('should handle fully qualified type names', () => {
    const constructorLine = 'public Service(com.example.repository.UserRepository userRepository) {';
    const pattern = /([\w.]+)\s+(\w+)\s*[,)]/g;

    const matches = Array.from(constructorLine.matchAll(pattern));
    assert.ok(matches.length > 0, 'Should find parameter');

    if (matches[0]) {
      const type = matches[0][1];
      const name = matches[0][2];
      assert.strictEqual(type, 'com.example.repository.UserRepository', 'Should handle FQN');
      assert.strictEqual(name, 'userRepository', 'Should extract parameter name');
    }
  });

  test('should identify constructor declaration line', () => {
    const lines = [
      'public class UserService {',
      '  private final UserRepository userRepository;',
      '  ',
      '  public UserService(UserRepository userRepository) {',
      '    this.userRepository = userRepository;',
      '  }'
    ];

    let constructorLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('public') && lines[i].includes('(') && lines[i].includes(')')) {
        const className = 'UserService';
        if (lines[i].includes(className + '(')) {
          constructorLineIndex = i;
          break;
        }
      }
    }

    assert.strictEqual(constructorLineIndex, 3, 'Should find constructor at line 3');
  });

  test('should determine cursor position relative to parameter', () => {
    const line = 'public UserService(UserRepository userRepository) {';
    const paramName = 'userRepository';

    // Find parameter name position
    const paramIndex = line.indexOf(paramName);
    assert.ok(paramIndex > 0, 'Should find parameter name');

    // Test cursor positions
    const cursorInParam = paramIndex + 5; // Middle of "userRepository"
    const cursorOutside = 10; // Before parameter

    assert.ok(cursorInParam >= paramIndex && cursorInParam <= paramIndex + paramName.length,
      'Cursor should be within parameter name');
    assert.ok(cursorOutside < paramIndex, 'Cursor should be outside parameter name');
  });

  test('should extract parameter index from position', () => {
    const line = 'public Service(UserRepo repo1, PaymentService payment, NotificationService notif) {';

    // Extract all parameters
    const pattern = /([\w.]+)\s+(\w+)\s*[,)]/g;
    const params: Array<{type: string; name: string; index: number}> = [];

    let match;
    let index = 0;
    while ((match = pattern.exec(line)) !== null) {
      params.push({
        type: match[1],
        name: match[2],
        index: index++
      });
    }

    assert.strictEqual(params.length, 3, 'Should find three parameters');
    assert.strictEqual(params[0].index, 0, 'First parameter index 0');
    assert.strictEqual(params[1].index, 1, 'Second parameter index 1');
    assert.strictEqual(params[2].index, 2, 'Third parameter index 2');
  });

  test('should handle constructor with annotations', () => {
    const lines = [
      '@Autowired',
      'public UserService(UserRepository userRepository) {'
    ];

    // Check if previous line has @Autowired
    const hasAutowired = lines[0].includes('@Autowired');
    assert.ok(hasAutowired, 'Should detect @Autowired annotation');

    // Parse constructor from second line
    const constructorLine = lines[1];
    assert.ok(constructorLine.includes('('), 'Should be constructor line');
  });

  test('should handle parameter with @Qualifier annotation', () => {
    const lines = [
      'public OrderService(',
      '  @Qualifier("alipay") PaymentService paymentService',
      ') {'
    ];

    // Check for @Qualifier in parameter line
    const paramLine = lines[1];
    const qualifierMatch = paramLine.match(/@Qualifier\s*\(\s*"(\w+)"\s*\)/);

    assert.ok(qualifierMatch, 'Should find @Qualifier');
    assert.strictEqual(qualifierMatch[1], 'alipay', 'Should extract qualifier value');
  });
});
