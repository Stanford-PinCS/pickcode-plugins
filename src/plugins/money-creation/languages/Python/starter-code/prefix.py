# Hidden helpers. runBanks checks the numbers, runs the student's createMoney function, and sends the chain of banks to the plot on the right. createMoney's loop calls addBank once for each bank, and addBank checks that bank's deposit and loan before adding it to the chain.
import math

# A new deposit from $10 to $1,000,000 and a required reserve ratio from 0.05 to 1 keep every chain on the plot: a loop that stops once the deposit is $1 or less then goes through at most 270 banks.
_MIN_DEPOSIT = 10
_MAX_DEPOSIT = 1000000
_MIN_RATIO = 0.05
# The most banks the plot draws, which also stops a loop that would never end.
_MAX_BANKS = 300

# The chain createMoney is building while runBanks runs it, and None the rest of the time.
_moneyChain = None


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


# Dollars with thousands separators, and cents only when they aren't zero: $800, $1.24.
def _money(value):
    cents = math.floor(abs(value) * 100 + 0.5)
    text = f"{cents // 100:,}" if cents % 100 == 0 else f"{cents // 100:,}.{cents % 100:02d}"
    return ("−" if value < 0 and cents > 0 else "") + "$" + text


# A dollar amount rounded to the nearest 1 ÷ scale of a dollar, as a whole number with its sign: 262144 for $262.144 at scale 1000.
def _units(value, scale):
    n = math.floor(abs(value) * scale + 0.5)
    return -n if value < 0 else n


# Dollars with thousands separators and exactly `digits` decimals: $262.144.
def _preciseMoney(value, digits):
    scale = 10 ** digits
    n = abs(_units(value, scale))
    return ("−" if value < 0 and n > 0 else "") + f"${n // scale:,}.{n % scale:0{digits}d}"


# Two different dollar amounts for an error message, as text, and how far apart they are. withinACent is true when they're at most a cent apart, allowing for floating-point rounding (8.1 − 0.81 comes out as 7.289999999999999, which rounds down to 7.28). underACent is true when they're less than a cent apart by more than that rounding; then both get the fewest decimals, from 3 up, that show them less than a cent apart ($3.910 and $3.905), so a message never reads "should be $262.14, but addBank got $262.14" or calls $3.91 and $3.90 less than a cent apart. Otherwise both show to the cent.
def _amounts(a, b):
    withinACent = abs(a - b) <= 0.01 + 1e-9 * max(1, abs(a), abs(b))
    for digits in range(3, 10):
        scale = 10 ** digits
        gap = abs(_units(a, scale) - _units(b, scale))
        if 0 < gap < scale // 100:
            return _preciseMoney(a, digits), _preciseMoney(b, digits), withinACent, True
    # Amounts a cent apart can still round to the same cent when each sits on a half cent, so then they get 3 decimals.
    if _money(a) == _money(b):
        return _preciseMoney(a, 3), _preciseMoney(b, 3), withinACent, False
    return _money(a), _money(b), withinACent, False


# Two dollar amounts that differ only by floating-point rounding count as equal.
def _close(a, b):
    return abs(a - b) <= 1e-9 * max(1, abs(a), abs(b))


def runBanks(newDeposit, reserveRatio, createMoney):
    global _moneyChain
    # nan fails every comparison, and inf is past the limit, so these catch both.
    if not _isNumber(newDeposit) or not _MIN_DEPOSIT <= newDeposit <= _MAX_DEPOSIT:
        raise ValueError(f"newDeposit should be a number of dollars from {_MIN_DEPOSIT} to {_MAX_DEPOSIT}, but it's {newDeposit!r}.")
    if not _isNumber(reserveRatio) or not _MIN_RATIO <= reserveRatio <= 1:
        raise ValueError(f"reserveRatio should be a number from {_MIN_RATIO} to 1, like 0.2 for 20%, but it's {reserveRatio!r}.")
    if not callable(createMoney):
        raise TypeError("runBanks needs your createMoney function as its last input.")

    _moneyChain = {"newDeposit": newDeposit, "reserveRatio": reserveRatio, "deposits": [], "loans": []}
    try:
        createMoney(newDeposit, reserveRatio)
    finally:
        finished = _moneyChain
        _moneyChain = None
    if len(finished["deposits"]) == 0:
        raise ValueError("createMoney didn't add any banks. Its loop should run while the deposit is more than $1 and call addBank(deposit, loan) once for each bank.")
    show_chain(reserveRatio, finished["deposits"], finished["loans"])


def addBank(deposit, loan):
    chain = _moneyChain
    if chain is None:
        raise RuntimeError("addBank only works inside createMoney, while runBanks runs it.")
    bank = len(chain["deposits"]) + 1
    if bank > _MAX_BANKS:
        raise RuntimeError(f"Your loop is still going after {_MAX_BANKS} banks. Make sure its condition stops it once the deposit gets small, the way deposit > 1 does.")
    if not _isNumber(deposit) or not math.isfinite(deposit):
        raise TypeError(f"addBank's first input should be the bank's deposit, a number of dollars, but for Bank {bank} it's {deposit!r}.")
    if not _isNumber(loan) or not math.isfinite(loan):
        raise TypeError(f"addBank's second input should be the bank's loan, a number of dollars, but for Bank {bank} it's {loan!r}.")
    if bank == 1 and not _close(deposit, chain["newDeposit"]):
        want, got, withinACent, _ = _amounts(chain["newDeposit"], deposit)
        fix = "Set deposit to newDeposit itself, without rounding." if withinACent else "Start the loop with deposit set to newDeposit, and call addBank before the line that passes the loan on."
        raise ValueError(f"Bank 1's deposit should be the new deposit, {want}, but addBank got {got}. {fix}")
    if bank > 1:
        previousLoan = chain["loans"][bank - 2]
        if not _close(deposit, previousLoan):
            want, got, withinACent, _ = _amounts(previousLoan, deposit)
            fix = "Set deposit to the loan itself, without rounding." if withinACent else "Each loan is deposited in the next bank, so the loop's last line should set deposit to the loan."
            raise ValueError(f"Bank {bank}'s deposit should be Bank {bank - 1}'s loan, {want}, but addBank got {got}. {fix}")
    # A loan may miss $0 or the excess reserves by floating-point rounding (a billionth of the deposit), but by no more.
    tolerance = 1e-9 * max(1, deposit)
    if loan < -tolerance:
        shown, _, _, underACent = _amounts(loan, 0)
        if underACent:
            fix = "That's less than a cent below $0, which rounding to the nearest cent can cause. Don't round the reserves or the loan."
        else:
            fix = "Check the line that sets loan: a bank lends from $0 up to its excess reserves, and a share such as holdRatio should be like 0.05 for 5%."
        raise ValueError(f"Bank {bank}'s loan is {shown}, but a loan can't be less than $0. {fix}")
    required = deposit * chain["reserveRatio"]
    excess = deposit - required
    if loan > excess + tolerance:
        lent, only, _, underACent = _amounts(loan, excess)
        if underACent:
            why = "That's less than a cent too much, which rounding to the nearest cent can cause. Don't round the reserves or the loan."
        else:
            why = f"A bank has to keep its required reserves: {chain['reserveRatio']!r} × {_money(deposit)} = {_money(required)}."
        raise ValueError(f"Bank {bank} lent {lent}, but its excess reserves are only {only}. {why}")
    chain["deposits"].append(deposit)
    # A loan a hair below $0 is floating-point rounding, as when a bank holds all its excess reserves, so it counts as $0.
    chain["loans"].append(max(0, loan))
