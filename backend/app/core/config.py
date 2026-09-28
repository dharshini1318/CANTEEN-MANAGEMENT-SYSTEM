from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusBite"
    API_V1_STR: str = "/api"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    # Optional MySQL Config
    MYSQL_USER: str | None = None
    MYSQL_PASSWORD: str | None = None
    MYSQL_HOST: str | None = None
    MYSQL_PORT: str | None = None
    MYSQL_DB: str | None = None

    @property
    def DATABASE_URL(self) -> str:
        if self.MYSQL_USER and self.MYSQL_HOST and self.MYSQL_DB:
            pwd = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
            port = f":{self.MYSQL_PORT}" if self.MYSQL_PORT else ""
            return f"mysql+pymysql://{self.MYSQL_USER}{pwd}@{self.MYSQL_HOST}{port}/{self.MYSQL_DB}"
        return "sqlite:///./campusbite.db"

    class Config:
        env_file = ".env"

settings = Settings()
