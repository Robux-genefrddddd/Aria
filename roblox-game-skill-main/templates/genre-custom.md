# Template: Custom & Hybrid Game Architecture

## Overview

This template provides a modular, highly extensible architecture designed for custom game concepts, genre mashups, emergent gameplay, and experimental Roblox games that don't fit into cookie-cutter genres.

It provides a decoupled **Service-Action-State** pattern where gameplay mechanics (abilities, interactions, custom physics, zone triggers, dynamic economies) can be plugged in seamlessly.

---

## Core Systems Manifest

1. **StateService** (`ServerScriptService/Services/StateService.lua`)
   - Finite State Machine (FSM) for global game state (Lobby, Intermission, Match, SuddenDeath, EndGame, FreePlay, etc.).
   - Replicates state changes to clients cleanly with transition hooks.

2. **ActionService** (`ServerScriptService/Services/ActionService.lua`)
   - Centralized handler for all player actions, abilities, tool interactions, and custom verbs.
   - Built-in token-bucket rate limiting and server authority validation (SE-2, SE-5).

3. **DataManager** (`ServerScriptService/Services/DataManager.lua`)
   - Schema-driven data storage supporting dynamic stats, inventories, unlockables, and custom flags.

4. **EventBus** (`ReplicatedStorage/Modules/EventBus.lua`)
   - Type-safe, decoupled event publisher/subscriber pattern for modular internal communication.

5. **ClientActionController** (`StarterPlayer/StarterPlayerScripts/ClientActionController.lua`)
   - Manages responsive player inputs (Keyboard, Gamepad, Touch), optimistic client prediction, and visual/haptic feedback ("game feel" / "juice").

6. **FeedbackController** (`StarterPlayer/StarterPlayerScripts/FeedbackController.lua`)
   - Centralized VFX, SFX, screen shake, camera effects, and Floating Numbers / UI micro-feedback.

---

## Folder Hierarchy

```
game
+-- ServerScriptService
|   +-- Main (Script)
|   +-- Services/
|       +-- DataManager (ModuleScript)
|       +-- StateService (ModuleScript)
|       +-- ActionService (ModuleScript)
|       +-- CustomGameService (ModuleScript)
+-- ReplicatedStorage
|   +-- Remotes/
|   |   +-- PlayerAction (RemoteEvent)
|   |   +-- StateChanged (RemoteEvent)
|   |   +-- PlayFeedback (RemoteEvent)
|   |   +-- RequestCustomAction (RemoteFunction)
|   +-- Modules/
|       +-- Constants (ModuleScript)
|       +-- Types (ModuleScript)
|       +-- EventBus (ModuleScript)
|       +-- StateMachine (ModuleScript)
+-- StarterGui
|   +-- MainHUD (ScreenGui)
|       +-- HUDController (LocalScript)
+-- StarterPlayer
|   +-- StarterPlayerScripts
|       +-- ClientActionController (LocalScript)
|       +-- FeedbackController (LocalScript)
+-- Workspace
    +-- InteractiveAreas (Folder)
    +-- Spawns (Folder)
```

---

## Data Schema (Flexible & Extensible)

```luau
export type PlayerData = {
    level: number,
    experience: number,
    primaryCurrency: number,
    secondaryCurrency: number,
    inventory: { [string]: number },
    unlockedPerks: { [string]: boolean },
    customAttributes: { [string]: any },
    settings: {
        musicEnabled: boolean,
        sfxEnabled: boolean,
        screenShake: boolean,
    },
    meta: {
        playtime: number,
        firstJoin: number,
        lastSave: number,
    }
}
```

---

## Core System Implementations

### 1. StateService (Finite State Machine)

```luau
-- ServerScriptService/Services/StateService.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local StateService = {}
StateService.__index = StateService

type GameState = "Lobby" | "Starting" | "Active" | "Overtime" | "Ending"

local currentState: GameState = "Lobby"
local stateChangeListeners: { (newState: GameState, oldState: GameState) -> () } = {}
local stateChangedRemote: RemoteEvent

function StateService.Init()
    local remotes = ReplicatedStorage:WaitForChild("Remotes")
    stateChangedRemote = remotes:WaitForChild("StateChanged") :: RemoteEvent
end

function StateService.GetState(): GameState
    return currentState
end

function StateService.SetState(newState: GameState, contextData: any?)
    if currentState == newState then return end
    local oldState = currentState
    currentState = newState

    stateChangedRemote:FireAllClients(newState, oldState, contextData)

    for _, listener in ipairs(stateChangeListeners) do
        task.spawn(listener, newState, oldState, contextData)
    end
end

function StateService.OnStateChanged(listener: (newState: GameState, oldState: GameState, contextData: any?) -> ())
    table.insert(stateChangeListeners, listener)
end

return StateService
```

### 2. ActionService (Modular & Secure Player Actions)

```luau
-- ServerScriptService/Services/ActionService.lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local ActionService = {}
local actionHandlers: { [string]: (player: Player, payload: any) -> (boolean, string?) } = {}
local cooldowns: { [Player]: { [string]: number } } = {}

local DEFAULT_COOLDOWN = 0.25

function ActionService.Init()
    local remotes = ReplicatedStorage:WaitForChild("Remotes")
    local actionRemote = remotes:WaitForChild("PlayerAction") :: RemoteEvent

    actionRemote.OnServerEvent:Connect(function(player: Player, actionName: any, payload: any)
        if typeof(actionName) ~= "string" then return end
        ActionService.ExecuteAction(player, actionName, payload)
    end)

    Players.PlayerRemoving:Connect(function(player)
        cooldowns[player] = nil
    end)
end

function ActionService.RegisterAction(name: string, handler: (player: Player, payload: any) -> (boolean, string?))
    actionHandlers[name] = handler
end

function ActionService.ExecuteAction(player: Player, actionName: string, payload: any): (boolean, string?)
    local handler = actionHandlers[actionName]
    if not handler then
        return false, "Action not found: " .. actionName
    end

    -- Rate limiting & cooldown verification (SE-5)
    local playerCooldowns = cooldowns[player]
    if not playerCooldowns then
        playerCooldowns = {}
        cooldowns[player] = playerCooldowns
    end

    local now = os.clock()
    local lastTime = playerCooldowns[actionName] or 0
    if now - lastTime < DEFAULT_COOLDOWN then
        return false, "Rate limited"
    end
    playerCooldowns[actionName] = now

    local success, err = pcall(handler, player, payload)
    if not success then
        warn(string.format("[ActionService] Error executing %s for %s: %s", actionName, player.Name, tostring(err)))
        return false, "Internal error"
    end
    return true, nil
end

return ActionService
```

### 3. FeedbackController (Game Feel & Juice)

```luau
-- StarterPlayer/StarterPlayerScripts/FeedbackController.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local feedbackRemote = remotes:WaitForChild("PlayFeedback") :: RemoteEvent
local camera = Workspace.CurrentCamera

local FeedbackController = {}

function FeedbackController.ShakeCamera(intensity: number, duration: number)
    intensity = intensity or 0.5
    duration = duration or 0.2
    local startTime = os.clock()

    task.spawn(function()
        while os.clock() - startTime < duration do
            local offset = Vector3.new(
                (math.random() - 0.5) * intensity,
                (math.random() - 0.5) * intensity,
                0
            )
            camera.CFrame = camera.CFrame * CFrame.new(offset)
            task.wait()
        end
    end)
end

feedbackRemote.OnClientEvent:Connect(function(feedbackType: string, options: any)
    if feedbackType == "ScreenShake" then
        FeedbackController.ShakeCamera(options.intensity, options.duration)
    elseif feedbackType == "FloatingText" then
        -- Render floating text popup above target part/position
    end
end)

return FeedbackController
```
