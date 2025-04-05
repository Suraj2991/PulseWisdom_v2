

export class EphemerisCalculatorSingleton {
  private static instance: EphemerisCalculator;
  private static isInitialized = false;

  private constructor() {}

  public static async getInstance(): Promise<EphemerisCalculator> {
    if (!EphemerisCalculatorSingleton.instance) {
      EphemerisCalculatorSingleton.instance = new EphemerisCalculator();
    }
    
    if (!EphemerisCalculatorSingleton.isInitialized) {
      await EphemerisCalculatorSingleton.instance.initialize();
      EphemerisCalculatorSingleton.isInitialized = true;
    }
    
    return EphemerisCalculatorSingleton.instance;
  }
} 