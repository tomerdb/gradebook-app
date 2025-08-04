# PlantUML Syntax Test

This is a simple test to verify PlantUML syntax is working.

## Test Use Case Diagram

```plantuml
@startuml
!theme plain

title Test Diagram

actor User
usecase "Login" as UC1
usecase "Logout" as UC2

User --> UC1
User --> UC2

@enduml
```

## Test Class Diagram

```plantuml
@startuml
!theme plain

title Test Class Diagram

class User {
  -id: Integer
  -name: String
  +login(): Boolean
  +logout(): void
}

class System {
  +authenticate(user): Boolean
}

User --> System : uses

@enduml
```

Copy and paste either of these test diagrams into PlantUML to verify the syntax is working correctly.
