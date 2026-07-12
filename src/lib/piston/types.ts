export interface TestCase {
  stdin: string;
  expectedStdout: string;
}

export interface TestResult {
  stdin: string;
  expectedStdout: string;
  actualStdout: string;
  passed: boolean;
  statusDescription: string;
}

export interface RunTestsInput {
  sourceCode: string;
  language: string;
  tests: TestCase[];
}

export interface CodeRunner {
  runTests(input: RunTestsInput): Promise<TestResult[]>;
}
