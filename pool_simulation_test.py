# Dice pool simulations for Monster Ambulance
import math
import random
import statistics

# Iterate 1000 times
N = 10000
# How many cards before randomizing?
top_cards = 4

# Reporting variables
total_rounds = {"players win": [], "gm wins": []}
total_player_wins = 0
total_hospital_arrivals = 0

# Persistent opposition: Driver Exhaustion + Breakdown, assume 2d6.
# Folded into the total pool. If we keep them separate, use gm_always below.
gm_always = []

# GM pool: 4d6 + d10 + persistent opposition
# Player pool: Hallmark + Calling + Career + Help. Assume d8+d10+d8+d8
def resetPools():
    return ([6, 6, 6, 6, 6, 6, 10], [8, 8, 8, 10], [8, 8, 8, 10])

# Function to check whether we should keep going.
def testPools(gm_pool, player_pool, player2_pool, current_round, hospital_location):
    global total_hospital_arrivals
    global total_player_wins
    global total_rounds

    # Hospital reached: players win.
    if current_round >= hospital_location:
        total_rounds["players win"].append(current_round)
        total_player_wins += 1
        total_hospital_arrivals += 1
        return False

    # Player die reduced below d4 - gm wins.
    if 2 in player_pool:
        total_rounds["gm wins"].append(current_round)
        return False

    # Two d12s in the GM pool - gm wins.
    if 12 in gm_pool:
        reduced_pool = gm_pool.copy()
        reduced_pool.remove(12)
        if 12 in reduced_pool:
            total_rounds["gm wins"].append(current_round)
            return False
        else:
            return True

    # GM pool reduced to d4 or less - players win.
    elif gm_pool == [4] or gm_pool == []:
        total_rounds["players win"].append(current_round)
        total_player_wins += 1
        return False
    else:
        return True

# Function to roll a dice pool.
# Returns a dict: {"total": total, "effect": effect die size}
def rollPool(pool):
    if len(pool) < 1:
        return {"total": 0, "effect": 0}

    temp_results = []
    temp_pool = pool.copy()
    # roll each die and add to results list.
    for x in pool:
        temp_results.append(math.floor(random.random() * x) + 1)

    # print(temp_results)

    # get the two highest as the total
    # remove items as we find them but don't delete - need lists to match for effect die.
    highest = max(temp_results)
    location = temp_results.index(highest)
    temp_results[location] = 0
    temp_pool[location] = 0

    second_highest = max(temp_results)
    second_location = temp_results.index(second_highest)
    temp_results[second_location] = 0
    temp_pool[second_location] = 0

    total = highest + second_highest
    effect = max(temp_pool)
    if effect == 0: effect = 4

    return {"total": total, "effect": effect}

#############################################
# Pool modification functions
# Each returns a list of the remaining dice in the pool
#############################################

# Find the highest die below d12 and raise it one step.
def stepUpGM(pool, effect):
    temp_pool = pool.copy()
    temp_pool.sort()
    temp_pool.reverse()
    for i, x in enumerate(temp_pool):
        if x < 12:
            if x < effect:
                temp_pool[i] = effect
            else:
                temp_pool[i] += 2
            break
    return temp_pool

def stepDownGM(gm_pool, gm_effect, player_effect):
    if len(gm_pool) == 0:
        return gm_pool
    if player_effect > gm_effect:
        if gm_effect in gm_pool:
            gm_pool.remove(gm_effect)
        else:
            gm_pool.remove(max(gm_pool))
    else:
        if gm_effect in gm_pool:
            gm_pool[gm_pool.index(gm_effect)] -= 2
        else:
            gm_pool[gm_pool.index(max(gm_pool))] -= 2
    return gm_pool


# If the player pool loses a die, it'll get caught by testPool.
def stepDownPlayer(pool, player_effect, gm_effect):
    p = pool.copy()
    p[p.index(player_effect)] -= 2
    return p

#############################################
# Main loop
#############################################

for x in range(0, N):
    # print("\n\nTrial " + str(x) +  " ------------------")

    # Reset the pools before simulating a scene.
    gm_pool, player_pool, player2_pool = resetPools()
    current_round = 0

    # The hospital is buried 8 + 1d4 cards deep.
    hospital_location = top_cards + math.floor(random.random() * 4) + 1
    # print(gm_pool, player_pool, hospital_location)

    while testPools(gm_pool, player_pool, player2_pool, current_round, hospital_location):
        # print(gm_pool, player_pool)

        # Keep statistics
        current_round += 1

        # Roll both pools. Pick the highest two values and use the highest die type of the remaining ones.
        player_res = rollPool(player_pool)
        gm_total_pool = gm_pool.copy()
        gm_total_pool.extend(gm_always)
        gm_res = rollPool(gm_total_pool)

        # print("\nFirst bout:")
        # print(player_pool)
        # print(player_res)
        # print(gm_total_pool)
        # print(gm_res)

        # Negative results means GM wins.
        result = player_res["total"] - gm_res["total"]
        # Whomever wins steps down a die in the opponent's pool.
        if result < 0:
            player_pool = stepDownPlayer(player_pool, player_res["effect"], gm_res["effect"])
            # sometimes step up a die, sometimes add one.
            if random.random() < 0.7:
                gm_pool = stepUpGM(gm_pool, gm_res["effect"])
            else:
                gm_pool.append(gm_res["effect"])
        else:
            gm_pool = stepDownGM(gm_pool, gm_res["effect"], player_res["effect"])

        player2_res = rollPool(player2_pool)
        gm_total_pool2 = gm_pool.copy()
        gm_total_pool2.extend(gm_always)
        gm2_res = rollPool(gm_total_pool2)

        # print("\nSecond bout:")
        # print(player2_pool)
        # print(player2_res)
        # print(gm_total_pool2)
        # print(gm2_res)

        result2 = player2_res["total"] - gm2_res["total"]
        if result2 < 0:
            player2_pool = stepDownPlayer(player2_pool, player2_res["effect"], gm_res["effect"])
            # sometimes step up a die, sometimes add one.
            if random.random() < 0.7:
                gm_pool = stepUpGM(gm_pool, gm_res["effect"])
            else:
                gm_pool.append(gm_res["effect"])
        else:
            gm_pool = stepDownGM(gm_pool, gm_res["effect"], player2_res["effect"])


# Print out results
player_mean = statistics.mean(total_rounds["players win"])
player_stdev = statistics.stdev(total_rounds["players win"])
player_high = round(player_mean + player_stdev, 2)
player_low = round(player_mean - player_stdev, 2)

gm_mean = statistics.mean(total_rounds["gm wins"])
gm_stdev = statistics.stdev(total_rounds["gm wins"])
gm_high = round(gm_mean + gm_stdev, 2)
gm_low = round(gm_mean - gm_stdev, 2)

print("Total number of tests: " + str(N))
print("Player win percentage: " + str( round( total_player_wins * 100 / N, 1 ) ) + "%")
print("Percent hospital arrivals: " + str( round( total_hospital_arrivals * 100 / N, 1 ) ) + "%")
print("When players win:")
print("  Average number of rounds: " + str(round(player_mean, 2)))
print("  Range: " + str(player_high) + " - " + str(player_low))
print("When GM wins:")
print("  Average number of rounds: " + str(round(gm_mean, 2)))
print("  Range: " + str(gm_high) + " - " + str(gm_low))
