import { Types } from 'mongoose';
import { BirthChartModel, IBirthChart } from '../../models/BirthChart';
import { User, IUser } from '../../models/User';
import { InsightModel } from '../../models/Insight';
import { InsightType } from '../../types/insight';

describe('Database Models', () => {
  describe('User Model', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8
        }
      };

      const user = new User(userData);
      await user.validate();

      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.password).toBeDefined();
    });

    it('should require email and password', async () => {
      const user = new User({});
      await expect(user.validate()).rejects.toThrow();
    });

    it('should validate email verification fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        isEmailVerified: true,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 3600000)
      };

      const user = new User(userData);
      await user.validate();

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationExpires).toBeDefined();
    });

    it('should validate password reset fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000)
      };

      const user = new User(userData);
      await user.validate();

      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    it('should validate notification preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          notificationPreferences: {
            email: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            push: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            frequency: 'daily',
            quietHours: {
              enabled: true,
              start: '22:00',
              end: '07:00'
            }
          }
        }
      };

      const user = new User(userData);
      await user.validate();

      expect(user.preferences.notificationPreferences.email.dailyInsights).toBe(true);
      expect(user.preferences.notificationPreferences.frequency).toBe('daily');
      expect(user.preferences.notificationPreferences.quietHours.start).toBe('22:00');
    });

    it('should validate insight preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          insightPreferences: {
            categories: ['personality', 'career'],
            severity: ['high', 'medium'],
            types: ['DAILY', 'PROGRESSION'],
            showRetrogrades: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true,
            dailyInsights: true,
            progressionInsights: true,
            lifeThemeInsights: true,
            birthChartInsights: true
          }
        }
      };

      const user = new User(userData);
      await user.validate();

      expect(user.preferences.insightPreferences.categories).toContain('personality');
      expect(user.preferences.insightPreferences.severity).toContain('high');
      expect(user.preferences.insightPreferences.types).toContain('DAILY');
    });

    it('should validate theme preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          themePreferences: {
            colorScheme: 'dark',
            fontSize: 'medium',
            showAspects: true,
            showHouses: true,
            showPlanets: true,
            showRetrogrades: true,
            showLunarPhases: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true
          }
        }
      };

      const user = new User(userData);
      await user.validate();

      expect(user.preferences.themePreferences.colorScheme).toBe('dark');
      expect(user.preferences.themePreferences.fontSize).toBe('medium');
      expect(user.preferences.themePreferences.showAspects).toBe(true);
    });

    it('should reject invalid notification preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          notificationPreferences: {
            email: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            push: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            frequency: 'invalid',
            quietHours: {
              enabled: true,
              start: '25:00',
              end: '07:00'
            }
          }
        }
      };

      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow();
    });

    it('should reject invalid insight preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          insightPreferences: {
            categories: ['invalid_category'],
            severity: ['invalid_severity'],
            types: ['INVALID_TYPE'],
            showRetrogrades: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true,
            dailyInsights: true,
            progressionInsights: true,
            lifeThemeInsights: true,
            birthChartInsights: true
          }
        }
      };

      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow();
    });

    it('should reject invalid theme preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        },
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          themePreferences: {
            colorScheme: 'invalid',
            fontSize: 'invalid',
            showAspects: true,
            showHouses: true,
            showPlanets: true,
            showRetrogrades: true,
            showLunarPhases: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true
          }
        }
      };

      const user = new User(userData);
      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('BirthChart Model', () => {
    it('should create a new birth chart with calculated values', async () => {
      const chartData = {
        userId: new Types.ObjectId().toString(),
        datetime: {
          year: 1990,
          month: 1,
          day: 1,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: '0'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 0
        },
        houseSystem: 'PLACIDUS',
        bodies: [{
          id: 0,
          name: 'Sun',
          longitude: 280.5,
          latitude: 0.0,
          speed: 1.02,
          house: 1,
          sign: 'Capricorn',
          signLongitude: 10.5,
          isRetrograde: false
        }],
        angles: {
          ascendant: 123.45,
          mc: 33.45,
          ic: 213.45,
          descendant: 303.45
        },
        houses: {
          cusps: [123.45, 153.45, 183.45, 213.45, 243.45, 273.45, 
                 303.45, 333.45, 3.45, 33.45, 63.45, 93.45],
          system: 'PLACIDUS'
        }
      };

      const chart = new BirthChartModel(chartData);
      await chart.validate();

      // Test basic fields
      expect(chart.userId).toBe(chartData.userId);
      expect(chart.datetime).toEqual(chartData.datetime);
      expect(chart.location).toEqual(chartData.location);
      expect(chart.houseSystem).toBe(chartData.houseSystem);

      // Test calculated values
      expect(chart.bodies).toHaveLength(1);
      expect(chart.bodies[0].id).toBe(0);
      expect(chart.bodies[0].name).toBe('Sun');
      expect(chart.bodies[0].longitude).toBe(280.5);
      expect(chart.bodies[0].sign).toBe('Capricorn');

      expect(chart.angles.ascendant).toBe(123.45);
      expect(chart.angles.mc).toBe(33.45);
      expect(chart.houses.cusps).toHaveLength(12);
      expect(chart.houses.system).toBe('PLACIDUS');
    });

    it('should require userId and datetime', async () => {
      const chart = new BirthChartModel({});
      await expect(chart.validate()).rejects.toThrow();
    });

    it('should validate celestial body data', async () => {
      const invalidChart = new BirthChartModel({
        userId: new Types.ObjectId().toString(),
        datetime: {
          year: 1990,
          month: 1,
          day: 1,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: '0'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 0
        },
        houseSystem: 'PLACIDUS',
        bodies: [{
          // Missing required fields
          id: 0,
          name: 'Sun'
        }]
      });

      await expect(invalidChart.validate()).rejects.toThrow();
    });
  });

  describe('Insight Model', () => {
    it('should create a new insight', async () => {
      const insight = new InsightModel({
        userId: new Types.ObjectId(),
        birthChartId: new Types.ObjectId(),
        insights: [{
          bodyId: 4, // Mars
          type: InsightType.PLANETARY_POSITION,
          aspects: [{
            bodyId: 5, // Jupiter
            type: 'conjunction',
            orb: 2.5
          }],
          description: 'Mars conjunct Jupiter'
        }],
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(insight.validate()).resolves.toBeUndefined();
    });

    it('should require userId and birthChartId', async () => {
      const insight = new InsightModel({
        insights: [{
          bodyId: 4,
          type: InsightType.PLANETARY_POSITION,
          description: 'Test insight'
        }],
        timestamp: new Date()
      });
      await expect(insight.validate()).rejects.toThrow();
    });
  });
});
