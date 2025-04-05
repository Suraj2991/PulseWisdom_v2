"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
var AIService = /** @class */ (function () {
    function AIService() {
    }
    AIService.prototype.analyzeStrengths = function (birthChart) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            area: 'Communication',
                            description: 'Strong ability to express ideas clearly',
                            supportingAspects: ['Mercury in Gemini', 'Third house emphasis']
                        },
                        {
                            area: 'Leadership',
                            description: 'Natural leadership qualities',
                            supportingAspects: ['Sun in Leo', 'First house emphasis']
                        }
                    ]];
            });
        });
    };
    AIService.prototype.analyzeChallenges = function (birthChart) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            area: 'Emotional Expression',
                            description: 'Learning to express emotions openly',
                            growthOpportunities: ['Moon in Capricorn', 'Fourth house challenges'],
                            supportingAspects: ['Saturn aspects to Moon']
                        }
                    ]];
            });
        });
    };
    AIService.prototype.identifyPatterns = function (birthChart) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            type: 'Grand Trine',
                            description: 'A harmonious pattern indicating natural talents',
                            planets: ['Sun', 'Moon', 'Jupiter'],
                            houses: [1, 5, 9]
                        }
                    ]];
            });
        });
    };
    AIService.prototype.analyzeHouseThemes = function (birthChart) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            theme: 'Self and Identity',
                            description: 'Strong focus on personal development',
                            supportingFactors: ['Sun in first house', 'Mars conjunct Ascendant'],
                            manifestation: 'Through leadership roles and personal initiatives'
                        }
                    ]];
            });
        });
    };
    AIService.prototype.analyzeHouseLords = function (birthChart) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            house: 1,
                            lord: 'Mars',
                            dignity: { score: 5, ruler: true },
                            influence: 'Strong drive for self-expression',
                            aspects: ['Conjunction with Sun', 'Trine with Jupiter']
                        }
                    ]];
            });
        });
    };
    AIService.prototype.generateCoreIdentityDescription = function (sun, moon, ascendant) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "Your core identity combines the creative energy of ".concat(this.getSignName(sun.longitude), " Sun with the emotional depth of ").concat(this.getSignName(moon.longitude), " Moon, rising in ").concat(this.getSignName(ascendant), ".")];
            });
        });
    };
    AIService.prototype.generateOverallSummary = function (strengths, challenges, patterns) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "Your birth chart reveals ".concat(strengths.length, " key strengths, ").concat(challenges.length, " areas for growth, and ").concat(patterns.length, " significant patterns that shape your life journey.")];
            });
        });
    };
    AIService.prototype.getSignName = function (longitude) {
        var signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        return signs[Math.floor(longitude / 30)];
    };
    return AIService;
}());
exports.AIService = AIService;
