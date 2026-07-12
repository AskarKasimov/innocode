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
  languageId: number;
  tests: TestCase[];
}

export interface Judge0Client {
  runTests(input: RunTestsInput): Promise<TestResult[]>;
}
