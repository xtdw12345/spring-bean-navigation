/**
 * Test data factory for creating Bean entities in tests
 * 
 * This factory provides convenient methods to create test instances of:
 * - BeanDefinition
 * - BeanLocation
 * - BeanInjectionPoint
 * - BeanCandidate
 * 
 * Usage:
 * ```typescript
 * const bean = BeanFactory.createBeanDefinition({
 *   name: 'userService',
 *   type: 'com.example.UserService'
 * });
 * ```
 */

import * as vscode from 'vscode';

/**
 * Bean location interface
 */
export interface BeanLocation {
  uri: vscode.Uri;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * Bean definition type enum
 */
export enum BeanDefinitionType {
  COMPONENT = 'COMPONENT',
  BEAN_METHOD = 'BEAN_METHOD',
  CONFIGURATION = 'CONFIGURATION'
}

/**
 * Injection type enum
 */
export enum InjectionType {
  FIELD = 'FIELD',
  CONSTRUCTOR = 'CONSTRUCTOR',
  SETTER_METHOD = 'SETTER_METHOD'
}

/**
 * Match reason enum
 */
export enum MatchReason {
  EXACT_QUALIFIER = 'EXACT_QUALIFIER',
  EXACT_NAME = 'EXACT_NAME',
  PRIMARY_BEAN = 'PRIMARY_BEAN',
  TYPE_MATCH = 'TYPE_MATCH',
  SUBTYPE_MATCH = 'SUBTYPE_MATCH'
}

/**
 * Bean definition interface
 */
export interface BeanDefinition {
  name: string;
  type: string;
  definitionType: BeanDefinitionType;
  location: BeanLocation;
  annotationType: string;
  scope?: string;
  qualifiers?: string[];
  isPrimary: boolean;
  isConditional: boolean;
  conditionalInfo?: string;
}

/**
 * Bean injection point interface
 */
export interface BeanInjectionPoint {
  injectionType: InjectionType;
  beanType: string;
  beanName?: string;
  location: BeanLocation;
  qualifier?: string;
  isRequired: boolean;
  fieldName?: string;
  parameterName?: string;
  parameterIndex?: number;
}

/**
 * Bean candidate interface
 */
export interface BeanCandidate {
  beanDefinition: BeanDefinition;
  matchScore: number;
  matchReason: MatchReason;
  displayLabel: string;
  displayDescription?: string;
  displayDetail?: string;
}

/**
 * Test data factory for creating Bean entities
 */
export class BeanFactory {
  /**
   * Create a BeanLocation with default values
   * @param overrides Optional overrides for default values
   * @returns BeanLocation instance
   */
  static createLocation(overrides?: Partial<BeanLocation>): BeanLocation {
    return {
      uri: vscode.Uri.file('/test/TestBean.java'),
      line: 10,
      column: 0,
      ...overrides
    };
  }

  /**
   * Create a BeanDefinition with default values
   * @param overrides Optional overrides for default values
   * @returns BeanDefinition instance
   */
  static createBeanDefinition(overrides?: Partial<BeanDefinition>): BeanDefinition {
    return {
      name: 'testBean',
      type: 'com.example.TestBean',
      definitionType: BeanDefinitionType.COMPONENT,
      location: BeanFactory.createLocation(),
      annotationType: '@Service',
      scope: 'singleton',
      qualifiers: [],
      isPrimary: false,
      isConditional: false,
      ...overrides
    };
  }

  /**
   * Create a BeanInjectionPoint with default values
   * @param overrides Optional overrides for default values
   * @returns BeanInjectionPoint instance
   */
  static createInjectionPoint(overrides?: Partial<BeanInjectionPoint>): BeanInjectionPoint {
    return {
      injectionType: InjectionType.FIELD,
      beanType: 'com.example.TestBean',
      location: BeanFactory.createLocation(),
      isRequired: true,
      fieldName: 'testBean',
      ...overrides
    };
  }

  /**
   * Create a BeanCandidate with default values
   * @param overrides Optional overrides for default values
   * @returns BeanCandidate instance
   */
  static createCandidate(overrides?: Partial<BeanCandidate>): BeanCandidate {
    return {
      beanDefinition: BeanFactory.createBeanDefinition(),
      matchScore: 70,
      matchReason: MatchReason.TYPE_MATCH,
      displayLabel: '$(symbol-class) TestBean',
      displayDescription: 'com.example',
      displayDetail: '@Service • testBean • /test/TestBean.java:10',
      ...overrides
    };
  }

  /**
   * Create a field injection point (convenience method)
   * @param beanType Type of bean to inject
   * @param fieldName Name of the field
   * @returns BeanInjectionPoint instance
   */
  static createFieldInjection(beanType: string, fieldName: string): BeanInjectionPoint {
    return BeanFactory.createInjectionPoint({
      injectionType: InjectionType.FIELD,
      beanType,
      fieldName
    });
  }

  /**
   * Create a constructor injection point (convenience method)
   * @param beanType Type of bean to inject
   * @param parameterName Name of the parameter
   * @param parameterIndex Index of the parameter
   * @returns BeanInjectionPoint instance
   */
  static createConstructorInjection(
    beanType: string,
    parameterName: string,
    parameterIndex: number
  ): BeanInjectionPoint {
    return BeanFactory.createInjectionPoint({
      injectionType: InjectionType.CONSTRUCTOR,
      beanType,
      parameterName,
      parameterIndex,
      fieldName: undefined
    });
  }

  /**
   * Create a @Service bean definition (convenience method)
   * @param name Bean name
   * @param type Bean type
   * @returns BeanDefinition instance
   */
  static createServiceBean(name: string, type: string): BeanDefinition {
    return BeanFactory.createBeanDefinition({
      name,
      type,
      annotationType: '@Service',
      definitionType: BeanDefinitionType.COMPONENT
    });
  }

  /**
   * Create a @Component bean definition (convenience method)
   * @param name Bean name
   * @param type Bean type
   * @returns BeanDefinition instance
   */
  static createComponentBean(name: string, type: string): BeanDefinition {
    return BeanFactory.createBeanDefinition({
      name,
      type,
      annotationType: '@Component',
      definitionType: BeanDefinitionType.COMPONENT
    });
  }

  /**
   * Create a @Bean method definition (convenience method)
   * @param name Bean name (method name)
   * @param type Return type
   * @returns BeanDefinition instance
   */
  static createBeanMethodDefinition(name: string, type: string): BeanDefinition {
    return BeanFactory.createBeanDefinition({
      name,
      type,
      annotationType: '@Bean',
      definitionType: BeanDefinitionType.BEAN_METHOD
    });
  }

  /**
   * Create a @Primary bean definition (convenience method)
   * @param name Bean name
   * @param type Bean type
   * @returns BeanDefinition instance
   */
  static createPrimaryBean(name: string, type: string): BeanDefinition {
    return BeanFactory.createBeanDefinition({
      name,
      type,
      isPrimary: true
    });
  }

  /**
   * Create a bean with @Qualifier (convenience method)
   * @param name Bean name
   * @param type Bean type
   * @param qualifier Qualifier value
   * @returns BeanDefinition instance
   */
  static createQualifiedBean(name: string, type: string, qualifier: string): BeanDefinition {
    return BeanFactory.createBeanDefinition({
      name,
      type,
      qualifiers: [qualifier]
    });
  }
}
