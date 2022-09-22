from setuptools import setup

setup(
    name='server_tsspredator',
    packages=['server_tsspredator'],
    include_package_data=True,
    install_requires=[
        'flask',
    ],
    package_data={'server_tsspredator': ['TSSpredator.jar', "exampleData/*"]},
)
