from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusBite"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "this_is_a_very_secret_key_for_jwt_auth_campusbite" # Should be changed in prod
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "campusbite"

    @property
    def DATABASE_URL(self) -> str:
        return "sqlite:///./campusbite.db"

    class Config:
        env_file = ".env"

settings = Settings()
