"""Deterministic eligibility engine. Pure functions, no web or I/O code apart from load_schemes."""

from saarthi_engine.fields import FIELDS, check_value
from saarthi_engine.optimizer import optimize
from saarthi_engine.questions import next_question
from saarthi_engine.rules import evaluate_all, evaluate_scheme
from saarthi_engine.schemes import SchemeError, load_schemes, validate_scheme

__all__ = [
    "FIELDS",
    "SchemeError",
    "check_value",
    "evaluate_all",
    "evaluate_scheme",
    "load_schemes",
    "next_question",
    "optimize",
    "validate_scheme",
]
