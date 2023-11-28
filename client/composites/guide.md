---
title: MetaMask Permissionless Snaps - Ceramic Data Models, Draft 1
author: Mark Krasner | <mzk@3box.io>
discussions-to: <https://github.com/dayksx/CAIPs/blob/main/CAIPs/caip-x.md> 
status: Draft
created: 2023-11-28
updated: 2023-11-28
---

## Summary
This guide is positioned to display how assessments and moderation of those assessments in software components (leveraging social relationships of trust) can be translated to ComposeDB data models for the Ceramic Network. The data models covered in this outline therefore closely align with this [CAIP-x](https://github.com/dayksx/CAIPs/blob/main/CAIPs/caip-x.md).

## Abstract
This draft translates the concepts of assertions made by communities to assess the trustworthiness in software components into ComposeDB data models. Each model, as well as the system design itself, comes with important trade-offs that will be outlined on this page.

This draft also assumed that the W3C Verifiable Credential standard will be used as the assertion standard across all claims generated in this system. 

Corresponding GraphQL file can be found [here](./00-verifiableCredential.graphql).

## Specification
The following section will begin by defining the general interface for Verifiable Credentials on ComposeDB before defining the specific interfaces and types relevant to the software component claims. The reasoning is to enable data interoperability across the Verifiable Credential class of data, therefore improving querying efficiency by allowing both broad and granular queries. 

### General Verifiable Credential Definitions
Below are the definitions for our broad Verifiable Credential data family that system-specific definitions (discussed later) will implement:

```GraphQL
## Broad VC interface that acts agnostic of our proof type
interface VerifiableCredential
  @createModel(description: "A verifiable credential interface")
{
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
}

type Issuer {
  id: String! @string(maxLength: 1000)
  name: String @string(maxLength: 1000)
}

type CredentialStatus {
  id: String! @string(maxLength: 1000)
  type: String! @string(maxLength: 1000)
}

type CredentialSchema {
  id: String! @string(maxLength: 1000)
  type: String! @string(maxLength: 1000)
}

## EIP712 proof which implements the proof-agnostic VC interface
interface VCEIP712Proof implements VerifiableCredential
  @createModel(description: "A verifiable credential interface of type EIP712")
{
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  proof: ProofEIP712!
}

## JWT proof interface
interface VCJWTProof implements VerifiableCredential
  @createModel(description: "A verifiable credential interface of type JWT")
{
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  proof: ProofJWT!
}

type ProofEIP712 {
  verificationMethod: String! @string(maxLength: 1000)
  created: DateTime! 
  proofPurpose: String! @string(maxLength: 1000)
  type: String! @string(maxLength: 1000)
  proofValue: String! @string(maxLength: 1000)
  eip712: EIP712!
}

type ProofJWT {
  type: String! @string(maxLength: 1000)
  jwt: String! @string(maxLength: 100000)
}

type EIP712 {
    domain: Domain! 
    types: ProofTypes!
    primaryType: String! @string(maxLength: 100)
}

type Types {
  name: String! @string(maxLength: 100)
  type: String! @string(maxLength: 100)
}

type ProofTypes {
    EIP712Domain: [Types!]! @list(maxLength: 100)
    CredentialSchema: [Types!]! @list(maxLength: 100)
    CredentialSubject: [Types!]! @list(maxLength: 100)
    Proof: [Types!]! @list(maxLength: 100)
    VerifiableCredential: [Types!]! @list(maxLength: 100)
}

type Domain {
  chainId: Int!
  name: String! @string(maxLength: 100)
  version: String! @string(maxLength: 100)
}
```

#### Proof Types
- Both EIP712 and JWT proof types are supported via interfaces
- Each will be queryable under the broader VC interface
- System can, at a later time, add support for additional proof tyes

#### Field: "context"
- ComposeDB does not support the use of special characters when defining schema field names
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/#contexts) use the `@context` property to define an ordered set
- Verifiable Credentials will therefore require simple deconstruction and reconstruction to account for this field naming convention when being saved to ComposeDB, and when being later recalled and reconstructed for verification

#### Field: "issuer"
- [W3C issuer definition](https://www.w3.org/TR/vc-data-model/#issuer) intakes either an object containing an id property, or a URI
- `Or` logic like this is not supported in ComposeDB
- Therefore, the compromise made here is a type with a mandatory `id` field and an optional `name`

#### Optional Fields
- [credentialStatus](https://www.w3.org/TR/vc-data-model/#status) and [expirationDate](https://www.w3.org/TR/vc-data-model/#expiration) are marked as optional, which matched up to the W3C definitions
- These may or may not be applicable to the specific system this guide discusses, but are included to help future-proof the parent definitions

#### Field Constraints
- String and List types require `maxLength` constraints
- Due to this requirement, almost all "String" field types have been assigned an arbitrary `maxLength` of 1000 characters (with the exception of the `jwt` field on the `ProofJWT` type), while all "List" fields have been assigned a `maxLength` of 100
- These should provide more than enough space for both types, albeit currently arbitrary

#### Interoperability
- These interfaces are designed to support Verifiable Credentials used for any claim purpose, both within this permissionless trust-enabled software component ecosystem and outside of it. 

### Account-to-Account Trust Signals
The following are interface and schema definitions related to trust assertions created between individuals based closely on those outlined in [this section](https://github.com/dayksx/CAIPs/blob/main/CAIPs/caip-x.md#data).

```GraphQL

###### Account Trust Subjects
type AccountTrustTypes {
  type: String! @string(maxLength: 1000)
  scope: String! @string(maxLength: 1000)
  level: String! @string(maxLength: 1000)
  reason: [String] @string(maxLength: 1000) @list(maxLength: 100)
}

type AccountTrustSubject
{
  id: DID! @accountReference
  trustworthiness: [AccountTrustTypes!]! @list(maxLength: 100)
}

######

###### Account Trust Interface
interface AccountTrustCredential implements VerifiableCredential  
  @createModel(description: "A verifiable credential interface for account trust credentials")
{
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: AccountTrustSubject! 
}
######

###### Account Trust Types

## EIP712 for Account Trust Credentials
## Will require SET accountRelation to recipient field
### Will NOT require field locking - we assume that the issuer might want to update assertions in the future
type AccountTrustCredential712 implements VerifiableCredential & AccountTrustCredential & VCEIP712Proof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type EIP712 for account trust credentials")
  @createIndex(fields: [{ path: "issuanceDate" }])
  @createIndex(fields: [{ path: "trusted" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: AccountTrustSubject! 
  trusted: Boolean!
  recipient: DID! @accountReference
  proof: ProofEIP712!
}

## define our JWT type that uses a hard-coded credentialSubject specific to our use case
## Will require SET accountRelation to recipient field
### Will NOT require field locking - we assume that the issuer might want to update assertions in the future
type AccountTrustCredentialJWT implements VerifiableCredential & AccountTrustCredential & VCJWTProof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type JWT for account trust credentials")
  @createIndex(fields: [{ path: "issuanceDate" }])
  @createIndex(fields: [{ path: "trusted" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: AccountTrustSubject! 
  trusted: Boolean!
  recipient: DID! @accountReference
  proof: ProofJWT!
}

######
```
#### AccountTrustCredential vs AccountDistrustCredential
- While a separate Verifiable Credential type will be created to differentiate between trust and distrust, these data models treat both as `AccountTrustCredentials`
- This is to allow both types to be queried efficiently within the same parent schema definition (methodology discussed later on)

#### Account Trust Subjects
- The `id` field within `AccountTrustSubject` defines an `@accountReference` as it will point to the `did:pkh` of the recipient
- The `reason` string array field is left optional

#### Account Trust Interface
- Implements the more general `VerifiableCredential` interface agnostic of proof type
- Defines specificity by utilizing the `AccountTrustSubject` type for the `credentialSubject` field

#### Account Trust Types
- Our `AccountTrustCredential712` and `AccountTrustCredentialJWT` types implement both the `VerifiableCredential` and `AccountTrustCredential` interfaces, in addition to their corresponding proof interfaces
- The `trusted` field would be used as the storage differentiator between trust and distrust, while the `@createIndex` directive aimed at the `trusted` field allows an index to be built on this field, which allows developers the ability to filter and order by trust vs distrust account credentials
- The `recipient` field has also been brought up to this specific type level, also enabling filtering, querying, and ordering by recipient based on their `did:pkh`

#### SET accountRelation
- At the moment, ComposeDB only supports accountRelations "Single" and "List"
- However, for this system, we know that we will want to limit users from creating an infinite number of `AccountTrustCredential` documents for another given user, thus creating additional work for entities calculating trust scores
- Support for the `SET` accountRelation is currently in development this season, which allows developers to limit the number of ComposeDB documents given a relation to another StreamID or AccountID defined within its schema to 1
- For example, we would want to define a `SET` accountRelation for the `AccountTrustCredential712` based on the `recipient` field defined within that schema, thus ensuring each account can only create 1 document for another given account

#### Field Locking
- Another feature currently in development is the ability for developers to define certain fields within a ComposeDB schema to "lock" (meaning cannot be mutated) after the genesis commit
- Given that ComposeDB is built on the Ceramic event streaming protocol, the StreamID for a given ComposeDB document will always point to the latest document version within that data stream
- While `CommitID` is a supported scalar type in ComposeDB, developers are not able to define relations between documents based on `CommitID` with the same fluidity as `StreamID`
- Unlike other definitions outlined in this system, this field locking mechanism WILL NOT be used for Account Trust Credentials
- This assumes that we will want to allow users the ability to update these assertions with new credentials over time (user trust would presumably be dynamic over time)

### Software Security Credentials
The subject, interface, and types for software security credentials take a similar approach:

```GraphQL
###### Software Security Subjects
enum Result {
  NONE
  LOW
  MEDIUM
  CRITICAL
}

type Findings {
  criticality: Result!
  description: String! @string(maxLength: 1000)
}

type SecurityReview {
  result: Result!
  findings: [Findings!]! @list(maxLength: 100)
  reportURI: URI
}

# id is set to CID type
type SecuritySubject
{
  id: CID! 
  securityReview: SecurityReview!
}
######

###### Software Security Interface

interface SoftwareSecurityCredential implements VerifiableCredential 
  @createModel(description: "A verifiable credential interface for software security credentials") {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: SecuritySubject! 
}
######

###### Software Security Types

# EIP712 for Security Review Credentials
# Will require SET accountRelation to softwareItemLocation field
## Will require field locking - we don't want the issuer to be able to update the assertions
### Ideally we would have ability to apply filter on reviewType Enum
type SoftwareSecurityCredential712 implements VerifiableCredential & SoftwareSecurityCredential & VCEIP712Proof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type EIP712 for software security credentials")
  @createIndex(fields: [{ path: "issuanceDate" }])
  @createIndex(fields: [{ path: "softwareItemLocation" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: SecuritySubject! 
  reviewType: Result!
  softwareItemLocation: CID! 
  proof: ProofEIP712!
}

## define our JWT type that uses a hard-coded credentialSubject specific to our use case
## Will require SET accountRelation to softwareItemLocation field
### Will require field locking - we don't want the issuer to be able to update the assertions
### Ideally we would have ability to apply filter on reviewType Enum
type SoftwareSecurityCredentialJWT implements VerifiableCredential & SoftwareSecurityCredential & VCJWTProof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type JWT for software security credentials")
  @createIndex(fields: [{ path: "issuanceDate" }])
  @createIndex(fields: [{ path: "softwareItemLocation" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: SecuritySubject! 
  reviewType: Result!
  softwareItemLocation: CID! 
  proof: ProofJWT!
}

######
```
#### Software Security Subjects
- The `id` field in `SecuritySubject` is currently set to intake a CID pointing to the actual (immutable) software artifact version location
- This is a divergence from the scalar type defined [here](https://github.com/dayksx/CAIPs/blob/main/CAIPs/caip-x.md#data) 
- This can alternatively be changed to intake a String to save the `did:snap` identifier in raw string format to Ceramic
- It is unlikely that `did:snap` will be natively supported (as `did:key` or `did:pkh` are in Ceramic), thus leaving the two options above to acommodate the identifier for the software artifact

#### Software Security Credential Interface
- Similar to the Account Trust interface, this one implements the broad `VerifiableCredential` interface, while using the `SecuritySubject` type for the `credentialSubject` field

#### Software Security Types: Limitations
- `reviewType` has intentionally been brought up to the type level to allow the result to be accessible - however, given that it's a nested type, filtering and ordering is not currently supported, but is planned for our future roadmap. The ability to filter and order by result (thus requiring support for index-building based on nested types) will be important for our use-case
- Similar to the account section, we will need the SET accountRelation mechanism to ensure only one audit can be issued per `softwareItemLocation`
- Unlike the account section, we will want the field locking mechanism to prevent audit issuers from updating documents after being created

### Moderation Credentials
The following definitions are intended for user-to-software audit assertions:

```GraphQL
###### Moderation Subjects

enum EndorsedResult {
  ENDORSED
  DISPUTED
}

type StatusReason {
  value: String! @string(maxLength: 1000)
  lang: String! @string(maxLength: 2)
}

type ModerationSubject {
  id: StreamID! @documentReference(model: "SoftwareSecurityCredential")
  currentStatus: EndorsedResult!
  statusReason: StatusReason!
}

######

###### Moderation Interface

interface ModerationCredential implements VerifiableCredential  
  @createModel(description: "A verifiable credential interface for moderating software security review credentials") {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: ModerationSubject! 
  reviewType: EndorsedResult!
}

######

###### Moderation Credentials

# EIP712 for moderation credentials
# Will require SET accountRelation to review field
## Will require field locking - we don't want the issuer to be able to update the assertions
### Ideally we would have ability to apply filter on reviewType Enum
type ModerationCredential712 implements VerifiableCredential & ModerationCredential & VCEIP712Proof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type EIP712 for moderating software security review credentials")
  @createIndex(fields: [{ path: "issuanceDate" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: ModerationSubject! 
  reviewType: EndorsedResult!
  reviewId: StreamID! @documentReference(model: "SoftwareSecurityCredential")
  review: SoftwareSecurityCredential! @relationDocument(property: "reviewId")
  proof: ProofEIP712!
}

# JWT for moderation credentials
# Will require SET accountRelation to review field
## Will require field locking - we don't want the issuer to be able to update the assertions
### Ideally we would have ability to apply filter on reviewType Enum
type ModerationCredentialJWT implements VerifiableCredential & ModerationCredential & VCJWTProof 
  @createModel(accountRelation: LIST, description: "A verifiable credential of type JWT for moderating software security review credentials")
  @createIndex(fields: [{ path: "issuanceDate" }]) {
  controller: DID! @documentAccount
  issuer: Issuer! 
  context: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  type: [String!]! @string(maxLength: 1000) @list(maxLength: 100)
  credentialSchema: CredentialSchema!
  credentialStatus: CredentialStatus
  issuanceDate: DateTime!
  expirationDate: DateTime
  credentialSubject: ModerationSubject! 
  reviewType: EndorsedResult!
  reviewId: StreamID! @documentReference(model: "SoftwareSecurityCredential")
  review: SoftwareSecurityCredential! @relationDocument(property: "reviewId")
  proof: ProofJWT!
}

######
```
#### Moderation Subject
- Unlike the other subjects, the `id` field intakes a `StreamID` documentReference to the specific audit issued (thus pointing to the representation of that audit in Ceramic)
- This is a slight divergence from the `CID` scalar type mentioned [here](https://github.com/dayksx/CAIPs/blob/main/CAIPs/caip-x.md#data) 
- As we will discuss later on, access to this document has also been pulled up to the moderation type level, thus allowing developers the ability to easily query and pull the corresponding data for that review 

#### Moderation Interface
- Implements the `ModerationSubject` type for `credentialSubject`

#### Moderation Credential Types: Limitations & Notes
- Similar to the Software Security credentials, we would ideally be able to filter and order by `reviewType` (which is a nested type that's intentionally been brought to this top level)
- SET accountRelation will be crucial for this data type
- Field locking mechanism is currently recommended for this data type - however, unsure whether it's necessary, or whether we want to allow users to update their moderation credentials after issuing (similar to how you can update a Google Business review after creation)
- `reviewId` and `review` fields have been brought up to this top level - this allows developers and interfaces to pull the corresponding document data based on the `review` field

### To-Do
- "Trust Score" scheme needs to be represented in this system
- Trust Score issuers should be able to efficiently query and read documents based on the design and considerations outlined above, but publishing of the trust score in a data model may not be suitable for ComposeDB