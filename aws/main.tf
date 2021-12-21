provider "aws" {
	region = "us-east-1"
}

resource "aws_vpc" "wwxr_vpc" {
	tags = { Name = "wwxr_vpc" }
	cidr_block = "10.0.0.0/16"
}

resource "aws_security_group" "wwxr_security_group" {
	tags = { Name = "wwxr_security_group" }
	vpc_id = aws_vpc.wwxr_vpc.id
	ingress {
		cidr_blocks = [ "0.0.0.0/0" ]
		from_port = 22
		to_port = 22
		protocol = "tcp"
	}
	ingress {
		cidr_blocks = [ "0.0.0.0/0" ]
		from_port = 80
		to_port = 80
		protocol = "tcp"
	}
	egress {
		cidr_blocks = [ "0.0.0.0/0" ]
		from_port = 0
		to_port = 0
		protocol = "-1"
	}
}

resource "aws_internet_gateway" "wwxr_internet_gateway" {
	tags = { Name = "wwxr_internet_gateway" }
	vpc_id = aws_vpc.wwxr_vpc.id
}
resource "aws_route_table" "wwxr_route_table" {
	tags = { Name = "wwxr_route_table" }
	vpc_id = aws_vpc.wwxr_vpc.id
	route {
		cidr_block = "0.0.0.0/0"
		gateway_id = aws_internet_gateway.wwxr_internet_gateway.id
	}
}

resource "aws_subnet" "wwxr_subnet" {
	tags = { Name = "wwxr_subnet" }
	vpc_id = aws_vpc.wwxr_vpc.id
	cidr_block = "10.0.1.0/24"
}
resource "aws_route_table_association" "wwxr_route_table_association" {
	subnet_id = aws_subnet.wwxr_subnet.id
	route_table_id = aws_route_table.wwxr_route_table.id
}

resource "aws_instance" "wwxr_base" {
	tags = { Name = "wwxr_base" }
	ami = "ami-083654bd07b5da81d"
	instance_type = "t3a.xlarge"
	subnet_id = aws_subnet.wwxr_subnet.id
	key_name = "wwxr_key"
	associate_public_ip_address = true
	vpc_security_group_ids = [ aws_security_group.wwxr_security_group.id ]
}

output "ip" {
	value = aws_instance.wwxr_base.public_ip
}
