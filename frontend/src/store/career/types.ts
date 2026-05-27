export type Profile = {
  basics: {
    name?: string
    birthMonth?: string
    gender?: string
    maritalStatus?: string
    currentTitle: string
    location: string
    yearsOfExperience: number | null
  }
  summary: string
  family: {
    childrenBirthMonths: string[]
    parents: {
      fatherBirthMonth: string
      motherBirthMonth: string
      fatherHasPension: string | null
      motherHasPension: string | null
      fatherLifeStatus?: string | null
      motherLifeStatus?: string | null
    }
    socialSecurityYears: number | null
  }
  preferences: {
    industries: string[]
    roleDirections: string[]
    workMode: string
    geoPreference: string
    salaryExpectation: string
  }
}

export type Goals = {
  timeWindow: string
  successCriteria: string
}

export type Constraints = {
  hoursPerWeek: number | null
  geoAndMode: string
  housingType?: 'rent' | 'own' | 'unknown'
  rentType?: 'shared' | 'alone' | 'unknown'
  commuteMode?: 'metro_bus' | 'taxi' | 'drive' | 'unknown'
  notes: string
}
