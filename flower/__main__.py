import sys
from celery.bin.celery import main as _main, celery
# from flower.command import flower
from command import flower_aioz


def main():
    celery.add_command(flower_aioz)
    sys.exit(_main())


if __name__ == "__main__":
    main()
