import secrets

class SessionManager(object):
    _instance = None

    def __init__(self):
        raise RuntimeError('This is a Singleton Class, call instance() instead')
    
    @classmethod
    def instance(cls):
        if cls._instance is None:
            print("Creating SessionManager Instance")
            cls._instance = cls.__new__(cls)
            #Complete any other necessary initialization here
        return cls._instance
    
    def generate_session_key(self, length=32):
        return secrets.token_hex(length)
        