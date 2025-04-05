import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum HouseSystem {
    placidus
    equal
  }

  type GeoPosition {
    latitude: Float!
    longitude: Float!
    placeName: String
  }

  type CelestialBody {
    id: Int!
    name: String!
    longitude: Float!
    latitude: Float!
    distance: Float!
    speed: Float!
    isRetrograde: Boolean!
    house: Int!
  }

  type House {
    number: Int!
    cusp: Float!
    nextCusp: Float!
    size: Float!
    rulerId: Int!
  }

  type Aspect {
    body1Id: Int!
    body2Id: Int!
    type: String!
    angle: Float!
    orb: Float!
    isApplying: Boolean!
  }

  type BirthChart {
    id: ID!
    userId: ID!
    date: String!
    time: String!
    location: GeoPosition!
    ascendant: Float!
    mc: Float!
    houses: [House!]!
    bodies: [CelestialBody!]!
    aspects: [Aspect!]!
    houseSystem: HouseSystem!
    createdAt: String!
    updatedAt: String!
  }

  type PlanetaryInsight {
    id: ID!
    userId: ID!
    date: String!
    type: String!
    description: String!
    interpretation: String!
    recommendations: [String!]!
    celestialBodies: [CelestialBody!]!
    aspects: [Aspect!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    birthChart(id: ID!): BirthChart
    birthChartsByUserId(userId: ID!): [BirthChart!]!
    planetaryInsight(id: ID!): PlanetaryInsight
    planetaryInsightsByUserId(userId: ID!): [PlanetaryInsight!]!
    currentPlanetaryPositions: [CelestialBody!]!
  }

  input DateTimeInput {
    year: Int!
    month: Int!
    day: Int!
    hour: Int!
    minute: Int!
    second: Int
    timezone: Int
  }

  input GeoPositionInput {
    latitude: Float!
    longitude: Float!
  }

  type Mutation {
    createBirthChart(
      userId: ID!
      datetime: DateTimeInput!
      location: GeoPositionInput!
      houseSystem: HouseSystem
    ): BirthChart!
    updateBirthChart(
      id: ID!
      datetime: DateTimeInput
      location: GeoPositionInput
      houseSystem: HouseSystem
    ): BirthChart!
    deleteBirthChart(id: ID!): Boolean!
    recalculateBirthChart(id: ID!): BirthChart!
  }

  type Subscription {
    planetaryPositionsUpdated: [CelestialBody!]!
  }
`; 