import structlog

_logger = structlog.get_logger("ems_ceu")

def get_logger():
    return _logger

