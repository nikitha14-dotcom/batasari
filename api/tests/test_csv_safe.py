import csv
import io

import pytest

from app.services.csv_safe import csv_safe


@pytest.mark.parametrize(
    "value",
    [
        "=HYPERLINK(\"http://example.com\",\"click\")",
        "+1+1",
        "-2+3",
        "@SUM(A1:A9)",
        "\tstarts with a tab",
        "\rstarts with a carriage return",
    ],
)
def test_formula_starters_are_neutralised(value):
    assert csv_safe(value).startswith("'")


def test_leading_whitespace_does_not_smuggle_a_formula_through():
    assert csv_safe("   =1+1").startswith("'")


@pytest.mark.parametrize(
    "value",
    [
        "good job!",
        "The health page did not load.",
        "I would rate this 5/5 - really useful",
        "a+b is fine mid-string",
        "",
    ],
)
def test_ordinary_text_is_untouched(value):
    assert csv_safe(value) == value


def test_none_becomes_empty_string():
    assert csv_safe(None) == ""


def test_numbers_survive_as_text():
    assert csv_safe(5) == "5"


def test_negative_numbers_are_quoted_rather_than_evaluated():
    # A bare -5 is a formula to a spreadsheet, so it gets the same treatment.
    assert csv_safe(-5) == "'-5"


def test_a_written_row_round_trips_with_the_guard_visible():
    buffer = io.StringIO()
    csv.writer(buffer).writerow([csv_safe("=1+1"), csv_safe("plain")])

    assert buffer.getvalue().strip() == "'=1+1,plain"


def test_newlines_inside_a_message_stay_in_one_field():
    buffer = io.StringIO()
    csv.writer(buffer).writerow([csv_safe("line one\nline two")])

    rows = list(csv.reader(io.StringIO(buffer.getvalue())))
    assert rows == [["line one\nline two"]]

